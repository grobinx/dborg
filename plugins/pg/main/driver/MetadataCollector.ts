import * as api from '../../../../src/api/db';
import Version, { versionToNumber } from '../../../../src/api/version';
import pg from 'pg';
import { Connection, driver_collector_builtInObjects, driver_collector_builtInObjects_default, driver_collector_constraints, driver_collector_constraints_default, driver_collector_identifiers, driver_collector_identifiers_default, driver_collector_indexStats, driver_collector_indexStats_default, driver_collector_permissions, driver_collector_permissions_default, driver_collector_relationColumnStats, driver_collector_relationColumnStats_default, driver_collector_relationStats, driver_collector_relationStats_default, driver_collector_systemObjects, driver_collector_systemObjects_default } from '.';
import { Tokenizer, getUniqueIdentifierPaths } from '../../../../src/main/api/SqlParser';

export class MetadataCollector implements api.IMetadataCollector {
    private metadata: api.Metadata = { status: "pending" };
    private version?: Version;
    private client: pg.Client | undefined;
    private collectionOptions?: api.MetadataCollectionOptions;
    private connection: Connection;
    private keywords: Set<string> = new Set();

    constructor(connection: Connection) {
        this.connection = connection;
        this.collectionOptions = {
            relationStats: connection.getProperties()[driver_collector_relationStats] as boolean ?? driver_collector_relationStats_default,
            relationColumnStats: connection.getProperties()[driver_collector_relationColumnStats] as boolean ?? driver_collector_relationColumnStats_default,
            identifiers: connection.getProperties()[driver_collector_identifiers] as boolean ?? driver_collector_identifiers_default,
            indexStats: connection.getProperties()[driver_collector_indexStats] as boolean ?? driver_collector_indexStats_default,
            systemObjects: connection.getProperties()[driver_collector_systemObjects] as boolean ?? driver_collector_systemObjects_default,
            builtInObjects: connection.getProperties()[driver_collector_builtInObjects] as boolean ?? driver_collector_builtInObjects_default,
            constraints: connection.getProperties()[driver_collector_constraints] as boolean ?? driver_collector_constraints_default,
            permissions: connection.getProperties()[driver_collector_permissions] as boolean ?? driver_collector_permissions_default,
        };
    }

    setVersion(version: Version): void {
        this.version = version;
    }

    setClient(client: pg.Client): void {
        this.client = client;
    }

    async collect(progress?: (current: string) => void): Promise<api.Metadata> {
        this.version = await this.connection.getVersion();
        this.client = new pg.Client(this.connection.getProperties());
        try {
            await this.client.connect();
            await this.initialize(progress);
        } finally {
            await this.client.end();
        }
        return this.metadata;
    }

    async initialize(progress?: (current: string) => void): Promise<void> {
        this.metadata = {
            status: "collecting",
            version: api.METADATA_VERSION,
            date: Date.now(),
            databases: {},
            collected: this.collectionOptions,
        };

        let schemaCount = 0;
        let currentSchema = 0;
        const internalProgress = async (current: string): Promise<void> => {
            if (progress) {
                progress(`(${currentSchema}/${schemaCount}) ` + current);
            }
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        await this.updateKeywords();

        await this.updateDatabases(internalProgress);
        await this.updateSchemas(internalProgress);
        schemaCount = Object.keys(this.connectedDatabase().schemas).length;
        for (const schema of Object.values(this.connectedDatabase().schemas)) {
            currentSchema++;
            await this.updateRelations(schema, internalProgress);
            if (this.collectionOptions?.relationStats) {
                await this.updateRelationsStats(schema, internalProgress);
            }
            await this.updateRoutines(schema, internalProgress);
            await this.updateColumns(schema, internalProgress);
            if (this.collectionOptions?.relationColumnStats) {
                await this.updateColumnsStats(schema, internalProgress);
            }
            await this.updateIndexes(schema, internalProgress);
            if (this.collectionOptions?.indexStats) {
                await this.updateIndexesStats(schema, internalProgress);
            }
            if (this.collectionOptions?.constraints) {
                await this.updateForeignKeys(schema, internalProgress);
                await this.updatePrimaryKeys(schema, internalProgress);
                await this.updateConstraints(schema, internalProgress);
            }
            await this.updateTypes(schema, internalProgress);
            await this.updateSequence(schema, internalProgress);
        }

        this.metadata.status = "ready";
    }

    async updateKeywords(): Promise<void> {
        const { rows } = await this.client!.query(`select lower(word) as word from pg_catalog.pg_get_keywords() union select lower(lanname) from pg_language`);
        this.keywords = new Set(rows.map((row: any) => row.word));
    }

    async updateDatabases(progress: (current: string) => Promise<void>, name?: string): Promise<void> {
        await progress("databases");
        const { rows } = await this.client!.query(
            `select d.oid::text as id, 
                    d.datname as name, 
                    format('%I', d.datname) as identity,
                    pg_catalog.pg_get_userbyid(d.datdba) as owner,
                    d.datname = current_database() as connected,
                    pg_catalog.shobj_description(d.oid, 'pg_database') as description,
                    d.datistemplate as template
                    ${this.collectionOptions?.permissions ? `, pg_catalog.json_build_object(
                        'create', pg_catalog.has_database_privilege(current_user, d.oid, 'CREATE'),
                        'connect', pg_catalog.has_database_privilege(current_user, d.oid, 'CONNECT'),
                        'temp', pg_catalog.has_database_privilege(current_user, d.oid, 'TEMPORARY')
                    ) as permissions` : ''}
                from pg_catalog.pg_database d
               where (d.datname = $1 or $1 is null)`,
            [name]
        );

        this.metadata.databases = this.metadata.databases ?? {};

        for (const row of rows as api.DatabaseMetadata[]) {
            if (this.metadata.databases[row.name]) {
                this.metadata.databases[row.name] = {
                    ...this.metadata.databases[row.name],
                    ...row,
                };
            }
            else {
                this.metadata.databases[row.name] = {
                    ...row,
                    objectType: "database",
                    schemas: {},
                    builtInRelations: {},
                    builtInRoutines: {},
                    builtInTypes: {},
                }
            }
        }
    }

    private connectedDatabase(): api.DatabaseMetadata {
        const databaseName = Object.values(this.metadata.databases ?? {}).find(db => db.connected)?.name;
        if (!databaseName) {
            throw new Error("No connected database found");
        }
        const database = this.metadata.databases?.[databaseName];
        if (!database) {
            throw new Error(`Database ${databaseName} not found`);
        }
        return database;
    }

    async updateSchemas(progress: (current: string) => Promise<void>, name?: string): Promise<void> {
        const database = this.connectedDatabase();

        await progress("schemas");
        const { rows } = await this.client!.query(
            `select n.oid::text as id,
                    n.nspname as name,
                    format('%I', n.nspname) as identity,
                    pg_catalog.pg_get_userbyid(n.nspowner) as owner, 
                    pg_catalog.obj_description(n.oid, 'pg_namespace') as description,
                    n.nspname = any (current_schemas(true)) as default,
                    n.nspname = any (array['pg_catalog', 'information_schema', 'pg_toast']) as catalog
                    ${this.collectionOptions?.permissions ?
                `, pg_catalog.json_build_object(
                        'create', pg_catalog.has_schema_privilege(current_user, n.oid, 'CREATE'),
                        'usage', pg_catalog.has_schema_privilege(current_user, n.oid, 'USAGE')
                    ) as permissions` : ''}
                from pg_catalog.pg_namespace n
               where (n.nspname = $1 or $1 is null)
               and n.nspname not ilike 'pg_toast%' and n.nspname not ilike 'pg_temp%'
               ${this.collectionOptions?.systemObjects ? '' : `and n.nspname not in ('pg_catalog', 'information_schema')`}`,
            [name]
        );

        for (const row of rows as api.SchemaMetadata[]) {
            if (database.schemas[row.name]) {
                database.schemas[row.name] = {
                    ...database.schemas[row.name],
                    ...row,
                };
            }
            else {
                database.schemas[row.name] = {
                    ...row,
                    objectType: "schema",
                    relations: {},
                    routines: {},
                    types: {},
                    sequences: {},
                }
            }
        }

        if (rows.length === 0 && name) {
            delete database.schemas[name];
        }
    }

    async updateRelations(schema: api.SchemaMetadata, progress: (current: string) => Promise<void>, name?: string): Promise<void> {
        await progress(schema.name + " relations");
        const { rows } = await this.client!.query(
            `select c.oid::text as id, 
                c.relname as name, 
                format('%I', c.relname) as identity,
                d.description,
                pg_catalog.pg_get_userbyid(c.relowner) as owner,
                case
                    when c.relkind in ('r', 'f', 'p', 't') then 'table'
                    when c.relkind in ('v', 'm') then 'view'
                end as "relationType",
                case
                    when c.relkind in ('r', 'v') then 'regular'
                    when c.relkind = 'f' then 'foreign'
                    when c.relkind = 'p' then 'partitioned'
                    when c.relkind = 't' then 'temporary'
                    when c.relkind = 'm' then 'materialized'
                end as kind
                ${this.collectionOptions?.permissions ? `, pg_catalog.json_build_object(
                    'select', pg_catalog.has_table_privilege(current_user, c.oid, 'SELECT'),
                    'insert', pg_catalog.has_table_privilege(current_user, c.oid, 'INSERT'),
                    'update', pg_catalog.has_table_privilege(current_user, c.oid, 'UPDATE'),
                    'delete', pg_catalog.has_table_privilege(current_user, c.oid, 'DELETE')
                ) as permissions` : ''}
                ${this.collectionOptions?.identifiers ? `, pg_catalog.pg_get_viewdef(c.oid, true) as viewdef` : ''}
            from pg_catalog.pg_class c
                join pg_catalog.pg_namespace n on c.relnamespace = n.oid
                left join pg_catalog.pg_description d on d.classoid = 'pg_class'::regclass and d.objoid = c.oid and d.objsubid = 0
                left join pg_catalog.pg_inherits inh on c.oid = inh.inhrelid
            where c.relkind in ('r', 'f', 'p', 't', 'v', 'm')
            and n.nspname not ilike 'pg_toast%' and n.nspname not ilike 'pg_temp%'
            ${this.collectionOptions?.systemObjects ? '' : `and n.nspname not in ('pg_catalog', 'information_schema')`}
            and n.nspname = $1
            and (c.relname = $2 or $2 is null)
            and inh.inhrelid is null`,
            [schema.name, name]
        );

        for (const row of rows as (api.RelationMetadata & { viewdef?: string })[]) {
            if (this.collectionOptions?.identifiers && row.viewdef) {
                const tokens = new Tokenizer(row.viewdef, { dialect: "postgres" }).tokenize();
                row.identifiers = getUniqueIdentifierPaths(tokens, { excludeKeywords: this.keywords });
                delete row.viewdef;
            }

            schema.relations[row.name] = {
                ...row,
                columns: [],
                objectType: "relation",
            };
        }
    }

    async updateRelationsStats(schema: api.SchemaMetadata, progress: (current: string) => Promise<void>, name?: string): Promise<void> {
        await progress(schema.name + ' relation statistics');

        const { rows } = await this.client!.query<api.RelationStatsMetadata>(
            `
    SELECT c.relname AS relation_name,
           pg_total_relation_size(c.oid) AS size,
           (pg_relation_size(c.oid) / current_setting('block_size')::bigint) AS pages,
           COALESCE(s.n_live_tup, NULLIF(c.reltuples, -1)::bigint) AS rows,
           CASE
               WHEN COALESCE(s.n_live_tup, NULLIF(c.reltuples, -1)::bigint) > 0
                    AND c.relkind IN ('r','f','m','t')
               THEN (c.relpages::numeric * current_setting('block_size')::bigint)
                    / GREATEST(COALESCE(s.n_live_tup, NULLIF(c.reltuples, -1)::bigint), 1)
               ELSE NULL
           END AS avg_row_length,
           (COALESCE(st.heap_blks_read, 0) * current_setting('block_size')::bigint) AS reads,
           ((COALESCE(s.n_tup_ins,0) + COALESCE(s.n_tup_upd,0) + COALESCE(s.n_tup_del,0)) *
            CASE
                WHEN COALESCE(s.n_live_tup, NULLIF(c.reltuples, -1)::bigint) > 0
                     AND c.relkind IN ('r','f','m','t')
                THEN (c.relpages::numeric * current_setting('block_size')::bigint)
                     / GREATEST(COALESCE(s.n_live_tup, NULLIF(c.reltuples, -1)::bigint), 1)
                ELSE 0
            END)::bigint AS writes,
           (COALESCE(s.seq_scan,0) + COALESCE(s.idx_scan,0)) AS scans,
           COALESCE(s.n_tup_ins,0) AS inserts,
           COALESCE(s.n_tup_upd,0) AS updates,
           COALESCE(s.n_tup_del,0) AS deletes,
           s.last_analyze
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    LEFT JOIN pg_stat_all_tables s ON s.relid = c.oid
    LEFT JOIN pg_statio_all_tables st ON st.relid = c.oid
    WHERE c.relkind IN ('r','f','m','t')
      AND n.nspname NOT ILIKE 'pg_toast%' AND n.nspname NOT ILIKE 'pg_temp%'
      ${this.collectionOptions?.systemObjects ? '' : `and n.nspname not in ('pg_catalog', 'information_schema')`}
      AND n.nspname = $1::text
      AND ($2::text IS NULL OR c.relname = $2)
    ORDER BY relation_name
    `,
            [schema.name ?? null, name ?? null]
        );

        for (const row of rows) {
            const rel = schema.relations[row["relation_name"]];
            if (!rel) continue;

            delete row["relation_name"];

            rel.stats = {
                size: row.size != null ? Number(row.size) : null,
                pages: row.pages != null ? Number(row.pages) : null,
                rows: row.rows != null ? Number(row.rows) : null,
                avgRowLength: row.avg_row_length != null ? Number(row.avg_row_length) : null,
                reads: row.reads != null ? Number(row.reads) : null,
                writes: row.writes != null ? Number(row.writes) : null,
                scans: row.scans != null ? Number(row.scans) : null,
                inserts: row.inserts != null ? Number(row.inserts) : null,
                updates: row.updates != null ? Number(row.updates) : null,
                deletes: row.deletes != null ? Number(row.deletes) : null,
                lastAnalyze: row.last_analyze != null ? row.last_analyze : null
            };

        }
    }

    async updateRoutines(schema: api.SchemaMetadata, progress: (current: string) => Promise<void>, name?: string): Promise<void> {
        await progress(schema.name + " routines");

        const v11OrHigher = this.version?.major !== undefined && this.version.major >= 11;
        const versionNumber = versionToNumber(this.version?.toString() ?? "");

        const routineTypeExpr = v11OrHigher
            ? "case when f.prokind in ('a', 'w', 'f') then 'function' when f.prokind = 'p' then 'procedure' end"
            : "'function'";

        const { rows } = await this.client!.query(
            `with routines_base as (
        select
            f.oid::text as id,
            pg_get_userbyid(f.proowner) as owner,
            f.proname as name,
            format('%I(%s)', f.proname, pg_get_function_identity_arguments(f.oid)) as identity,
            ${routineTypeExpr} as "routineType",
            case
                when t.typname = 'trigger' then 'trigger'
                when ${v11OrHigher ? "f.prokind = 'a'" : "f.proisagg"} then 'aggregate'
                when ${v11OrHigher ? "f.prokind = 'w'" : "f.proiswindow"} then 'window'
                ${v11OrHigher ? "when f.prokind in ('f', 'p') then 'regular'" : "else 'regular'"}
            end as kind
            ${this.collectionOptions?.permissions ? `, pg_catalog.json_build_object(
                'execute', has_function_privilege(f.oid, 'EXECUTE')
            ) as permissions` : ''},
            pg_catalog.pg_get_function_result(f.oid) as "returnType",
            d.description as description,
            (
                select json_agg(row_to_json(a))
                from (
                    select
                        (f.oid::bigint * 100 + n)::text as id,
                        n as no,
                        f.proargnames[n] as name,
                        pg_catalog.format_type(f.proargtypes[n - 1], -1) as "dataType",
                        case f.proargmodes[n]
                            when 'o' then 'out'
                            when 'b' then 'inout'
                            else 'in'
                        end as mode,
                        trim(
                            (regexp_split_to_array(
                                pg_get_expr(f.proargdefaults, 0),
                                '[\t,](?=(?:[^\'']|\''[^\'']*\'')*$)'
                            ))[
                                case
                                    when f.pronargs - n > f.pronargdefaults then null
                                    else f.pronargdefaults - (f.pronargs - n + 1) + 1
                                end
                            ]
                        ) as "defaultValue"
                    from pg_catalog.generate_series(1, f.pronargs::int) n
                ) a
            ) as arguments
            ${this.collectionOptions?.identifiers ? `, f.prosrc` : ''},
            json_build_object(
                'is_security_definer', f.prosecdef,
                'execute_as', case when f.prosecdef then 'definer' else 'invoker' end,
                'language', l.lanname,
                'volatility', case f.provolatile
                    when 'i' then 'immutable'
                    when 's' then 'stable'
                    when 'v' then 'volatile'
                end,
                'parallel_safe', ${versionNumber >= 90600 ? "f.proparallel != 'u'" : "false"}
            ) as data
        from pg_catalog.pg_proc f
            join pg_catalog.pg_language l on f.prolang = l.oid
            left join pg_catalog.pg_namespace n on f.pronamespace = n.oid
            left join pg_catalog.pg_type t on f.prorettype = t.oid
            left join pg_catalog.pg_description d on d.classoid = f.tableoid and d.objoid = f.oid and d.objsubid = 0
        where n.nspname = $1::text
            and (f.proname = $2 or $2 is null)
            and n.nspname not ilike 'pg_toast%'
            and n.nspname not ilike 'pg_temp%'
            ${this.collectionOptions?.systemObjects ? '' : `and n.nspname not in ('pg_catalog', 'information_schema')`}
            ${v11OrHigher ? "and f.prokind in ('a', 'w', 'f', 'p')" : ""}
    )
    select
        rb.*,
        row_number() over (
            partition by rb.name, rb."routineType"
            order by rb.identity, rb.id::bigint
        )::int as overload
    from routines_base rb
    order by rb.name, rb."routineType", overload`,
            [schema.name, name]
        );

        for (const row of rows as (api.RoutineMetadata & { prosrc?: string })[]) {
            if (this.collectionOptions?.identifiers && row.prosrc) {
                const tokens = new Tokenizer(row.prosrc, { dialect: "postgres" }).tokenize();
                row.identifiers = getUniqueIdentifierPaths(tokens, { excludeKeywords: this.keywords });
                delete row.prosrc;
            }

            if (schema.routines![row.name]) {
                schema.routines![row.name] = [
                    ...schema.routines![row.name],
                    {
                        ...row,
                        objectType: "routine"
                    }
                ];
            }
            else {
                schema.routines![row.name] = [{
                    ...row,
                    objectType: "routine"
                }];
            }
        }
    }

    async updateColumns(schema: api.SchemaMetadata, progress: (current: string) => Promise<void>, name?: string): Promise<void> {
        await progress(schema.name + ' columns');

        const { rows } = await this.client!.query(
            `select cl.relname as relation_name, 
                        json_agg(json_build_object(
                            'id', (cl.oid::bigint *10000 +att.attnum)::text, 
                            'name', att.attname, 
                            'identity', format('%I.%I', cl.relname, att.attname),
                            'no', att.attnum, 
                            'dataType', att.atttypid::regtype::text,
                            'displayType', pg_catalog.format_type(att.atttypid, att.atttypmod),
                            'nullable', att.attnotnull, 
                            'defaultValue', pg_catalog.pg_get_expr(def.adbin, def.adrelid),
                            'foreignKey', exists (select from pg_catalog.pg_constraint where conrelid = att.attrelid and contype='f' and att.attnum = any(conkey)),
                            'primaryKey', exists (select from pg_catalog.pg_constraint where conrelid = att.attrelid and contype='p' and att.attnum = any(conkey)),
                            'unique', exists (select from pg_catalog.pg_constraint where conrelid = att.attrelid and contype='u' and att.attnum = any(conkey))
                            ${this.collectionOptions?.permissions ? `, 'permissions', 
                                json_build_object(
                                    'select', pg_catalog.has_column_privilege(current_user, cl.oid, att.attnum, 'SELECT'),
                                    'update', pg_catalog.has_column_privilege(current_user, cl.oid, att.attnum, 'UPDATE')
                                )` : ''},
                            'description', des.description
                        ) order by att.attnum) as columns
                from pg_catalog.pg_attribute att
                        join pg_catalog.pg_class cl on cl.oid = att.attrelid
                        join pg_catalog.pg_namespace na on na.oid = cl.relnamespace
                        left outer join pg_catalog.pg_attrdef def on adrelid = att.attrelid and adnum = att.attnum
                        left outer join pg_catalog.pg_description des on des.classoid = 'pg_class'::regclass and des.objoid = att.attrelid and des.objsubid = att.attnum
                        left join pg_catalog.pg_inherits inh on cl.oid = inh.inhrelid
                where att.attnum > 0
                    and cl.relkind in ('r', 'f', 'p', 't', 'v', 'm')
                    and na.nspname not ilike 'pg_toast%' and na.nspname not ilike 'pg_temp%'
                    ${this.collectionOptions?.systemObjects ? '' : `and na.nspname not in ('pg_catalog', 'information_schema')`}
                    and na.nspname = $1::text
                    and (cl.relname = $2 or $2 is null)
                    and inh.inhrelid is null
                group by cl.relname`,
            [schema.name, name]
        );

        for (const row of rows as { relation_name: string; columns: api.ColumnMetadata[] }[]) {
            const relation = schema.relations[row.relation_name];
            if (relation) {
                relation.columns = row.columns;
            }
        }
    }

    async updateColumnsStats(schema: api.SchemaMetadata, progress: (current: string) => Promise<void>, name?: string): Promise<void> {
        await progress(schema.name + ' columns statistics');

        const { rows } = await this.client!.query(
            `
    SELECT st.tablename AS relation_name,
           st.attname AS column_name,
           st.null_frac,
           st.avg_width,
           st.n_distinct,
           array_to_json(st.most_common_vals) AS most_common_vals,
           array_to_json(st.most_common_freqs) AS most_common_freqs,
           array_to_json(st.histogram_bounds) AS histogram
    FROM pg_stats st
    WHERE st.schemaname = $1::text
      AND ($2::text IS NULL OR st.tablename = $2::text)
      and st.schemaname not ilike 'pg_toast%' and st.schemaname not ilike 'pg_temp%'
      ${this.collectionOptions?.systemObjects ? '' : `and st.schemaname not in ('pg_catalog', 'information_schema')`}
    ORDER BY st.tablename, st.attname
    `,
            [schema.name, name ?? null]
        );

        for (const row of rows as any[]) {
            const rel = schema.relations[row.relation_name];
            if (!rel) continue;

            const col = rel.columns.find(c => c.name === row.column_name);
            if (!col) continue;

            col.stats = Object.assign(col.stats || {}, {
                nullFraction: row.null_frac != null ? Number(row.null_frac) : null,
                avgWidth: row.avg_width != null ? Number(row.avg_width) : null,
                nDistinct: row.n_distinct != null ? Number(row.n_distinct) : null,
                mostCommonValues: row.most_common_vals ?? null,
                mostCommonFreqs: row.most_common_freqs ?? null,
                histogram: row.histogram ?? null
            });
        }
    }

    async updateForeignKeys(schema: api.SchemaMetadata, progress: (current: string) => Promise<void>, name?: string): Promise<void> {
        await progress(schema.name + " foreign keys");
        const { rows } = await this.client!.query(
            `select
                cl.relname as relation_name,
                json_agg(json_build_object(
                    'id', con.oid::text,
                    'name', con.conname,
                    'identity', format('%I', con.conname),
                    'column', array(select a.attname from pg_attribute a where a.attnum = any(con.conkey) and a.attrelid = cl.oid),
                    'referencedSchema', rn.nspname,
                    'referencedTable', rcl.relname,
                    'referencedColumn', array(select ra.attname from pg_attribute ra where ra.attnum = any(con.confkey) and ra.attrelid = rcl.oid),
                    'onUpdate', case con.confupdtype
                        when 'a' then 'no action'
                        when 'r' then 'restrict'
                        when 'c' then 'cascade'
                        when 'n' then 'set null'
                        when 'd' then 'set default'
                    end,
                    'onDelete', case con.confdeltype
                        when 'a' then 'no action'
                        when 'r' then 'restrict'
                        when 'c' then 'cascade'
                        when 'n' then 'set null'
                        when 'd' then 'set default'
                    end,
                    'description', pg_catalog.obj_description(con.oid, 'pg_constraint')
                )) as "foreignKeys"
            from
                pg_constraint con
                join pg_class cl on con.conrelid = cl.oid
                join pg_namespace n on cl.relnamespace = n.oid
                join pg_class rcl on con.confrelid = rcl.oid
                join pg_namespace rn on rcl.relnamespace = rn.oid
                left join pg_catalog.pg_inherits inh on cl.oid = inh.inhrelid
            where
                con.contype = 'f'
                and n.nspname not ilike 'pg_toast%' and n.nspname not ilike 'pg_temp%'
                ${this.collectionOptions?.systemObjects ? '' : `and n.nspname not in ('pg_catalog', 'information_schema')`}
                and inh.inhrelid is null
                and n.nspname = $1::text
                and (cl.relname = $2::text or $2::text is null)
            group by
                cl.relname
            order by
                cl.relname`,
            [schema.name, name]
        );

        for (const row of rows as object[] as { schema_name: string; relation_name: string; foreignKeys: api.ForeignKeyMetadata[] }[]) {
            schema.relations[row.relation_name].foreignKeys = row.foreignKeys;
        }
    }

    async updateIndexes(schema: api.SchemaMetadata, progress: (current: string) => Promise<void>, name?: string): Promise<void> {
        await progress(schema.name + " indexes");
        const { rows } = await this.client!.query(
            `select i.relation_name,
                json_agg(json_build_object(
                    'id', i.id::text,
                    'name', i.name,
                    'description', i.description,
                    'columns', i.columns,
                    'unique', i.unique,
                    'primary', i.primary
                )) as indexes
            from 
                (select
                    n.nspname as schema_name,
                    ct.relname as relation_name,
                    ix.indexrelid as id,
                    ci.relname as name,
                    format('%I', ci.relname) as identity,
                    pg_catalog.obj_description(ix.indexrelid, 'pg_class') as description,
                    json_agg(json_build_object(
                        'name', a.attname,
                        'order', case ix.indoption[array_position(ix.indkey, a.attnum) - 1] & 1
                            when 1 then 'desc'
                            else 'asc'
                        end,
                        'nulls', case ix.indoption[array_position(ix.indkey, a.attnum) - 1] & 2
                            when 2 then 'last'
                            else 'first'
                        end
                    )) as columns,
                    ix.indisunique as unique,
                    ix.indisprimary as primary
                from
                    pg_index ix
                    join pg_class ci on ix.indexrelid = ci.oid
                    join pg_class ct on ix.indrelid = ct.oid
                    join pg_namespace n on ct.relnamespace = n.oid
                    left join pg_attribute a on a.attnum = any(ix.indkey) and a.attrelid = ct.oid
                    left join pg_catalog.pg_inherits inh on ct.oid = inh.inhrelid
                where
                    n.nspname not ilike 'pg_toast%' and n.nspname not ilike 'pg_temp%'
                    ${this.collectionOptions?.systemObjects ? '' : `and n.nspname not in ('pg_catalog', 'information_schema')`}
                    and inh.inhrelid is null
                    and n.nspname = $1::text
                    and (ct.relname = $2::text or $2::text is null)
                group by
                    n.nspname, ct.relname, ci.relname, ix.indexrelid, ix.indisunique, ix.indisprimary) i
            group by
                i.relation_name
            order by
                i.relation_name`,
            [schema.name, name]
        );

        for (const row of rows as object[] as { schema_name: string; relation_name: string; indexes: api.IndexMetadata[] }[]) {
            schema.relations[row.relation_name].indexes = row.indexes;
        }
    }

    async updateIndexesStats(schema: api.SchemaMetadata, progress: (current: string) => Promise<void>, name?: string): Promise<void> {
        await progress(schema.name + ' indexes statistics');

        const { rows } = await this.client!.query(
            `
    SELECT ct.relname AS relation_name,
           ci.relname AS index_name,
           ix.indexrelid AS index_oid,
           pg_relation_size(ix.indexrelid) AS size,
           (pg_relation_size(ix.indexrelid) / current_setting('block_size')::bigint) AS pages,
           NULLIF(ci.reltuples, -1)::bigint AS rows,
           (COALESCE(st.idx_blks_read,0) * current_setting('block_size')::bigint) AS reads,
           (COALESCE(st.idx_blks_hit,0) * current_setting('block_size')::bigint) AS hits,
           COALESCE(si.idx_scan,0) AS scans
    FROM pg_index ix
    JOIN pg_class ci ON ci.oid = ix.indexrelid
    JOIN pg_class ct ON ct.oid = ix.indrelid
    JOIN pg_namespace n ON ct.relnamespace = n.oid
    LEFT JOIN pg_stat_all_indexes si ON si.indexrelid = ix.indexrelid
    LEFT JOIN pg_statio_all_indexes st ON st.indexrelid = ix.indexrelid
    WHERE n.nspname NOT ILIKE 'pg_toast%' AND n.nspname NOT ILIKE 'pg_temp%'
      ${this.collectionOptions?.systemObjects ? '' : `and n.nspname not in ('pg_catalog', 'information_schema')`}
      AND n.nspname = $1::text
      AND ($2::text IS NULL OR ct.relname = $2::text)
    ORDER BY relation_name, index_name
    `,
            [schema.name ?? null, name ?? null]
        );

        for (const row of rows as any[]) {
            const rel = schema.relations[row.relation_name];
            if (!rel || !rel.indexes) continue;

            const idx = rel.indexes.find(i => String(i.id) === String(row.index_oid) || i.name === row.index_name);
            if (!idx) continue;

            idx.stats = Object.assign(idx.stats || {}, {
                rows: row.rows != null ? Number(row.rows) : null,
                size: row.size != null ? Number(row.size) : null,
                pages: row.pages != null ? Number(row.pages) : null,
                reads: row.reads != null ? Number(row.reads) : null,
                hits: row.hits != null ? Number(row.hits) : null,
                scans: row.scans != null ? Number(row.scans) : null,
            });
        }
    }

    async updatePrimaryKeys(schema: api.SchemaMetadata, progress: (current: string) => Promise<void>, name?: string): Promise<void> {
        await progress(schema.name + " primary keys");
        const { rows } = await this.client!.query(
            `select
                cl.relname as relation_name,
                json_build_object(
                    'id', con.oid::text,
                    'name', con.conname,
                    'columns', json_agg(a.attname order by array_position(con.conkey, a.attnum)),
                    'description', pg_catalog.obj_description(con.oid, 'pg_constraint')
                ) as "primaryKey"
            from
                pg_constraint con
                join pg_class cl on con.conrelid = cl.oid
                join pg_namespace n on cl.relnamespace = n.oid
                join pg_attribute a on a.attnum = any(con.conkey) and a.attrelid = cl.oid
                left join pg_catalog.pg_inherits inh on cl.oid = inh.inhrelid
            where
                con.contype = 'p'
                and n.nspname not ilike 'pg_toast%' and n.nspname not ilike 'pg_temp%'
                ${this.collectionOptions?.systemObjects ? '' : `and n.nspname not in ('pg_catalog', 'information_schema')`}
                and inh.inhrelid is null
                and n.nspname = $1::text
                and (cl.relname = $2::text or $2::text is null)
            group by
                cl.relname, con.oid, con.conname
            order by
                cl.relname`,
            [schema.name, name]
        );

        for (const row of rows as { schema_name: string; relation_name: string; primaryKey: api.PrimaryKeyMetadata }[]) {
            schema.relations[row.relation_name].primaryKey = row.primaryKey;
        }
    }

    async updateConstraints(schema: api.SchemaMetadata, progress: (current: string) => Promise<void>, name?: string): Promise<void> {
        await progress(schema.name + " constraints");
        const { rows } = await this.client!.query(
            `select 
                c.relation_name,
                json_agg(json_build_object(
                    'id', c.id::text,
                    'name', c.name,
                    'description', c.description,
                    'type', c.type,
                    'expression', c.expression
                )) as constraints
            from (
                select
                    n.nspname as schema_name,
                    ct.relname as relation_name,
                    con.oid as id,
                    con.conname as name,
                    format('%I', con.conname) as identity,
                    pg_catalog.obj_description(con.oid, 'pg_constraint') as description,
                    case con.contype
                        when 'c' then 'check'
                        when 't' then 'trigger' 
                        when 'x' then 'exclude'
                        else con.contype::varchar
                    end as type,
                    pg_get_constraintdef(con.oid) as expression
                from
                    pg_constraint con
                    join pg_class ct on con.conrelid = ct.oid
                    join pg_namespace n on ct.relnamespace = n.oid
                    left join pg_catalog.pg_inherits inh on ct.oid = inh.inhrelid
                where
                    n.nspname not ilike 'pg_toast%' and n.nspname not ilike 'pg_temp%'
                    ${this.collectionOptions?.systemObjects ? '' : `and n.nspname not in ('pg_catalog', 'information_schema')`}
                    and con.contype not in ('p', 'f', 'u') 
                    and inh.inhrelid is null
                    and n.nspname = $1::text
                    and (ct.relname = $2::text or $2::text is null)
            ) c
            group by
                c.relation_name
            order by
                c.relation_name`,
            [schema.name, name]
        );

        for (const row of rows as { schema_name: string; relation_name: string; constraints: api.ConstraintMetadata[] }[]) {
            schema.relations[row.relation_name].constraints = row.constraints;
        }
    }

    async updateTypes(schema: api.SchemaMetadata, progress: (current: string) => Promise<void>, name?: string): Promise<void> {
        await progress(schema.name + " types");
        const { rows } = await this.client!.query(
            `select
                t.oid::text as id,
                t.typname as name,
                format('%I', t.typname) as identity,
                pg_catalog.obj_description(t.oid, 'pg_type') as description,
                pg_catalog.pg_get_userbyid(t.typowner) as owner,
                case t.typtype
                    when 'b' then 'base'
                    when 'c' then 'composite'
                    when 'd' then 'domain'
                    when 'e' then 'enum'
                    when 'p' then 'pseudo'
                    when 'r' then 'range'
                    when 'm' then 'multirange'
                end as kind,
                array_to_json(array(
                    select enumlabel
                    from pg_enum
                    where enumtypid = t.oid
                    order by enumsortorder
                )) as values,
                array_to_json(array(
                    select 
                        json_build_object(
                            'id', t.oid::bigint *100 +a.attnum,
                            'name', a.attname,
                            'dataType', pg_catalog.format_type(a.atttypid, a.atttypmod),
                            'nullable', not a.attnotnull,
                            'defaultValue', pg_catalog.pg_get_expr(ad.adbin, ad.adrelid)
                        ) attributes
                    from pg_attribute a
                        left join pg_attrdef ad on a.attrelid = ad.adrelid and a.attnum = ad.adnum
                    where
                        a.attrelid = t.typrelid and a.attnum > 0
                    order by 
                        a.attnum
                )) as attributes
                ${this.collectionOptions?.permissions ? `, pg_catalog.json_build_object(
                    'usage', has_type_privilege(t.oid, 'USAGE')
                ) as permissions` : ''}
            from
                pg_type t
                join pg_namespace n on t.typnamespace = n.oid
                left join pg_catalog.pg_class c on c.oid=t.typrelid and c.relkind <> 'c'
                left join pg_catalog.pg_type te on te.oid = t.typelem
            where
                n.nspname not ilike 'pg_toast%' and n.nspname not ilike 'pg_temp%'
                ${this.collectionOptions?.systemObjects ? '' : `and n.nspname not in ('pg_catalog', 'information_schema')`}
                and t.typtype in ('b', 'c', 'd', 'e', 'p', 'r', 'm')
                and c.oid is null
                and te.oid is null
                and n.nspname = $1::text
                and (t.typname = $2::text or $2::text is null)`,
            [schema.name, name]
        );

        for (const row of rows as api.TypeMetadata[]) {
            schema.types![row.name] = {
                ...row,
                objectType: "type"
            };
        }
    }

    async updateSequence(schema: api.SchemaMetadata, progress: (current: string) => Promise<void>, name?: string): Promise<void> {
        if (this.version?.major !== undefined && this.version.major < 10) {
            return; // DBORG not supported versions lower than 10 for sequences
        }
        await progress(schema.name + " sequences");
        const { rows } = await this.client!.query(
            `select
                seq.oid::text as id,
                seq.relname as name,
                format('%I', seq.relname) as identity,
                pg_catalog.pg_get_userbyid(seq.relowner) as owner,
                pg_catalog.obj_description(seq.oid, 'pg_class') as description,
                s.seqincrement as increment,
                s.seqmin as min,
                s.seqmax as max,
                s.seqstart as start,
                s.seqcache as cache,
                s.seqcycle as cycled
                ${this.collectionOptions?.permissions ? `, pg_catalog.json_build_object(
                    'select', has_sequence_privilege(seq.oid, 'SELECT'),
                    'usage', has_sequence_privilege(seq.oid, 'USAGE'),
                    'update', has_sequence_privilege(seq.oid, 'UPDATE')
                ) as permissions` : ''}
            from
                pg_class seq
                join pg_namespace n on seq.relnamespace = n.oid
                join pg_sequence s on seq.oid = s.seqrelid
            where
                seq.relkind = 'S'
                and n.nspname not ilike 'pg_toast%' and n.nspname not ilike 'pg_temp%'
                ${this.collectionOptions?.systemObjects ? '' : `and n.nspname not in ('pg_catalog', 'information_schema')`}
                and n.nspname = $1::text
                and (seq.relname = $2::text or $2::text is null)`,
            [schema.name, name]
        );

        for (const row of rows as api.SequenceMetadata[]) {
            schema.sequences![row.name] = {
                ...row,
                objectType: "sequence",
            };
        }
    }
}
