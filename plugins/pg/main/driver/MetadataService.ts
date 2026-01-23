import { Connection } from 'src/main/api/db';
import * as api from '../../../../src/api/db';
import Version from 'src/api/version';
import pg from 'pg';
import fs from 'fs/promises';
import zlib from "zlib";
import { version as dborgVersion, dborgReleaseName, version } from '../../../../src/api/consts';

export class MetadataCollector implements api.IMetadataCollector {
    private databases: api.DatabasesMetadata = {};
    private inited = false;
    private version?: Version;
    private client: pg.Client | undefined;

    setVersion(version: Version): void {
        this.version = version;
    }

    setClient(client: pg.Client): void {
        this.client = client;
    }

    async restoreMetadata(fileName: string): Promise<api.DatabasesMetadata> {
        const packed = await fs.readFile(fileName);
        const json = zlib.gunzipSync(packed).toString("utf-8");
        const parsed = JSON.parse(json);

        // Sprawdź wersję
        if (!parsed._version || parsed._version !== version.release) {
            throw new Error(
                `Incompatible metadata version: ${parsed._version ?? "unknown"} (expected ${version.release})`
            );
        }

        this.databases = parsed.databases ?? parsed;
        this.inited = true;
        return this.databases;
    }

    async storeMetadata(fileName: string): Promise<void> {
        const json = JSON.stringify({
            _version: version.release,
            _date: Date.now(),
            databases: this.databases
        }, null, 2);
        const packed = zlib.gzipSync(json);
        await fs.writeFile(fileName, packed);
    }

    async getMetadata(progress?: (current: string) => void, force?: boolean): Promise<api.DatabasesMetadata> {
        if (!this.inited || force) {
            if (!this.client) {
                throw new Error("Client is not set");
            }
            await this.initialize(progress);
        }
        return this.databases;
    }

    async updateObject(progress?: (current: string) => void, schemaName?: string, objectName?: string): Promise<void> {
        if (schemaName) {
            await this.updateSchemas(progress, schemaName);
        }
        if (objectName) {
            await this.updateRelations(progress, schemaName, objectName);
            await this.updateRoutines(progress, schemaName, objectName);
            await this.updateColumns(progress, schemaName, objectName);
            await this.updateForeignKeys(progress, schemaName, objectName);
            await this.updateIndexes(progress, schemaName, objectName);
            await this.updatePrimaryKeys(progress, schemaName, objectName);
            await this.updateConstraints(progress, schemaName, objectName);
            await this.updateTypes(progress, schemaName, objectName);
            await this.updateSequence(progress, schemaName, objectName);
        }
    }

    async initialize(progress?: (current: string) => void): Promise<void> {
        this.databases = {};

        await this.updateDatabases(progress);
        await this.updateSchemas(progress);
        await this.updateRelations(progress);
        await this.updateRoutines(progress);
        await this.updateColumns(progress);
        await this.updateForeignKeys(progress);
        await this.updateIndexes(progress);
        await this.updatePrimaryKeys(progress);
        await this.updateConstraints(progress);
        await this.updateTypes(progress);
        await this.updateSequence(progress);

        this.inited = true;
    }

    private removeUnused(from: Record<string, any>, exists: Set<string>): void {
        for (const key in from) {
            if (!exists.has(key)) {
                delete from[key];
            }
        }
    }

    async updateDatabases(progress?: (current: string) => void, name?: string): Promise<void> {
        if (progress) {
            progress("databases");
        }
        const { rows } = await this.client!.query(
            `select d.oid as id, 
                    d.datname as name, 
                    pg_catalog.pg_get_userbyid(d.datdba) as owner,
                    d.datname = current_database() as connected,
                    pg_catalog.shobj_description(d.oid, 'pg_database') as description,
                    pg_catalog.json_build_object(
                        'create', pg_catalog.has_database_privilege(current_user, d.oid, 'CREATE'),
                        'connect', pg_catalog.has_database_privilege(current_user, d.oid, 'CONNECT')
                    ) as permissions,
                    d.datistemplate as template
                from pg_catalog.pg_database d
               where (d.datname = $1 or $1 is null)`,
            [name]
        );

        const exists = new Set<string>();

        for (const row of rows as api.DatabaseMetadata[]) {
            exists.add(row.name);

            if (this.databases[row.name]) {
                this.databases[row.name] = {
                    ...this.databases[row.name],
                    ...row,
                };
            }
            else {
                this.databases[row.name] = {
                    ...row,
                    schemas: {},
                    builtInRelations: {},
                    builtInRoutines: {},
                    builtInTypes: {},
                }
            }
        }

        if (!name) {
            this.removeUnused(this.databases, exists);
        }
    }

    private connectedDatabase(): api.DatabaseMetadata {
        const databaseName = Object.values(this.databases).find(db => db.connected)?.name;
        if (!databaseName) {
            throw new Error("No connected database found");
        }
        const database = this.databases[databaseName];
        if (!database) {
            throw new Error(`Database ${databaseName} not found`);
        }
        return database;
    }

    async updateSchemas(progress?: (current: string) => void, name?: string): Promise<void> {
        const database = this.connectedDatabase();

        if (progress) {
            progress("schemas");
        }
        const { rows } = await this.client!.query(
            `select n.oid as id,
                    n.nspname as name,
                    pg_catalog.pg_get_userbyid(n.nspowner) as owner, 
                    pg_catalog.obj_description(n.oid, 'pg_namespace') as description,
                    n.nspname = any (current_schemas(true)) as default,
                    n.nspname = any (array['pg_catalog', 'information_schema', 'pg_toast']) as catalog,
                    pg_catalog.json_build_object(
                        'create', pg_catalog.has_schema_privilege(current_user, n.oid, 'CREATE'),
                        'usage', pg_catalog.has_schema_privilege(current_user, n.oid, 'USAGE')
                    ) as permissions
                from pg_catalog.pg_namespace n
               where (n.nspname = $1 or $1 is null)
               and n.nspname not ilike 'pg_toast%' and n.nspname not ilike 'pg_temp%'`,
            [name]
        );

        const exists = new Set<string>();

        for (const row of rows as api.SchemaMetadata[]) {
            exists.add(row.name);

            if (database.schemas[row.name]) {
                database.schemas[row.name] = {
                    ...database.schemas[row.name],
                    ...row,
                };
            }
            else {
                database.schemas[row.name] = {
                    ...row,
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

        if (!name) {
            this.removeUnused(database.schemas, exists);
        }
    }

    async updateRelations(progress?: (current: string) => void, schemaName?: string, name?: string): Promise<void> {
        const database = this.connectedDatabase();

        if (progress) {
            progress("tables" + (schemaName ? (" of " + schemaName) : ""));
        }
        const { rows } = await this.client!.query(
            `with kw as (
                select lower(word) as word from pg_catalog.pg_get_keywords()
                union
                select lower(lanname) from pg_language
            )
            select c.oid as id, n.nspname schema_name, c.relname as name, d.description,
                pg_catalog.pg_get_userbyid(c.relowner) as owner,
                case
                    when c.relkind in ('r', 'f', 'p', 't') then 'table'
                    when c.relkind in ('v', 'm') then 'view'
                end as type,
                case
                    when c.relkind in ('r', 'v') then 'regular'
                    when c.relkind = 'f' then 'foreign'
                    when c.relkind = 'p' then 'partitioned'
                    when c.relkind = 't' then 'temporary'
                    when c.relkind = 'm' then 'materialized'
                end as kind,
                pg_catalog.json_build_object(
                    'select', pg_catalog.has_table_privilege(current_user, c.oid, 'SELECT'),
                    'insert', pg_catalog.has_table_privilege(current_user, c.oid, 'INSERT'),
                    'update', pg_catalog.has_table_privilege(current_user, c.oid, 'UPDATE'),
                    'delete', pg_catalog.has_table_privilege(current_user, c.oid, 'DELETE')
                ) as permissions,
                ids.identifiers
            from pg_catalog.pg_class c
                join pg_catalog.pg_namespace n on c.relnamespace = n.oid
                left join pg_catalog.pg_description d on d.classoid = 'pg_class'::regclass and d.objoid = c.oid and d.objsubid = 0
                left join pg_catalog.pg_inherits inh on c.oid = inh.inhrelid
                left join lateral (
                    select array_agg(distinct lower(m[1]) order by lower(m[1])) as identifiers
                    from regexp_matches(
                            pg_catalog.pg_get_viewdef(c.oid, true),
                            '([A-Za-z_][A-Za-z0-9_]*)',
                            'g'
                        ) as m
                    where lower(m[1]) not in (select word from kw)
                        and m[1] not in ('', '_')
                        and c.relkind in ('v', 'm')  -- tylko dla widoków
                ) ids on true
            where c.relkind in ('r', 'f', 'p', 't', 'v', 'm')
            and n.nspname not ilike 'pg_toast%' and n.nspname not ilike 'pg_temp%'
            and (n.nspname = $1 or $1 is null)
            and (c.relname = $2 or $2 is null)
            and inh.inhrelid is null
            order by schema_name`,
        [schemaName, name]
    );

    const exists = new Set<string>();
    let schema: api.SchemaMetadata | undefined;
    let schema_name: string | undefined;

    for (const row of rows as api.RelationMetadata[]) {
        if (schema_name !== row["schema_name"]) {
            if (!name && schema) {
                this.removeUnused(schema.relations, exists);
            }
            exists.clear();
            schema = database.schemas[row["schema_name"]];
            schema_name = row["schema_name"];
        }

        delete row["schema_name"];
        if (schema) {
            exists.add(row.name);
            if (schema.relations[row.name]) {
                schema.relations[row.name] = {
                    ...schema.relations[row.name],
                    ...row,
                };
            }
            else {
                schema.relations[row.name] = {
                    ...row,
                    columns: [],
                };
            }
        }
    }

    if (rows.length === 0 && schemaName && name) {
        delete schema?.[schemaName].tables[name];
    }

    if (rows.length === 0 && !schemaName && name) {
        for (const schema of Object.values(database.schemas).filter(s => s.default)) {
            delete schema.relations[name];
        }
    }

    if (!name && schema) {
        this.removeUnused(schema.relations, exists);
    }
}

    async updateRoutines(progress?: (current: string) => void, schemaName?: string, name?: string): Promise<void> {
        const database = this.connectedDatabase();

        if (progress) {
            progress("routines" + (schemaName ? (" of " + schemaName) : ""));
        }

        const v11OrHigher = this.version?.major !== undefined && this.version.major >= 11;

        const { rows } = await this.client!.query(
            `with kw as (
                select lower(word) as word from pg_catalog.pg_get_keywords()
                union
                select lower(lanname) from pg_language
            )
            select f.oid id, n.nspname schema_name, pg_get_userbyid(f.proowner) as owner, f.proname as name,
                ${v11OrHigher ? "case when f.prokind in ('a', 'w', 'f') then 'function' when f.prokind = 'p' then 'procedure' end" : "'function'"} as type,
                case 
                    when t.typname = 'trigger' then 'trigger'
                    when ${v11OrHigher ? "f.prokind = 'a'" : "f.proisagg"} then 'aggregate'
                    when ${v11OrHigher ? "f.prokind = 'w'" : "f.proiswindow"} then 'window'
                    ${v11OrHigher ? "when f.prokind in ('f', 'p') then 'regular'" : "else 'regular'"}
                end as kind,
                json_build_object(
                    'execute', has_function_privilege(f.oid, 'EXECUTE')
                ) AS permissions,
                pg_catalog.pg_get_function_result(f.oid) as "returnType",
                d.description as description,
                (select json_agg(row_to_json(a))
                    from (select f.oid::bigint *100 +n id, n as no, f.proargnames[n] as name, pg_catalog.format_type(f.proargtypes[n -1], -1) as "dataType",
                                case f.proargmodes[n] when 'o' then 'out' when 'b' then 'inout' else 'in' end as mode,
                                trim((regexp_split_to_array(pg_get_expr(f.proargdefaults, 0), '[\t,](?=(?:[^\'']|\''[^\'']*\'')*$)'))[case when f.pronargs -n > f.pronargdefaults then null else f.pronargdefaults -(f.pronargs -n +1) +1 end]) as "defaultValue"
                            from pg_catalog.generate_series(1, f.pronargs::int) n) a) as arguments,
                ids.identifiers
            from pg_catalog.pg_proc f
                left join pg_catalog.pg_namespace n on f.pronamespace = n.oid
                left join pg_catalog.pg_type t on f.prorettype = t.oid
                left join pg_catalog.pg_description d on d.classoid = f.tableoid and d.objoid = f.oid and d.objsubid = 0
                left join lateral (
                    select array_agg(distinct lower(m[1]) order by lower(m[1])) as identifiers
                    from regexp_matches(
                            -- użyj prosrc, jeśli wolisz bez deklaracji; możesz zamienić na pg_get_functiondef(f.oid)
                            f.prosrc,
                            '([A-Za-z_][A-Za-z0-9_]*)',  -- tylko identyfikatory, bez stringów
                            'g'
                        ) as m
                    where lower(m[1]) not in (select word from kw)  -- odfiltruj słowa kluczowe i języki
                        and m[1] not in ('', '_')
                    ) ids on true
            where (n.nspname = $1 or $1 is null)
                and (f.proname = $2 or $2 is null)
                and n.nspname not ilike 'pg_toast%' and n.nspname not ilike 'pg_temp%'
            ${v11OrHigher ? "and f.prokind in ('a', 'w', 'f', 'p')" : ""}
            order by schema_name, name`,
            [schemaName, name]
        );

        const exists = new Set<string>();
        let schema: api.SchemaMetadata | undefined;
        let schema_name: string | undefined;

        for (const row of rows as api.RoutineMetadata[]) {
            if (schema_name !== row["schema_name"]) {
                if (!name && schema) {
                    this.removeUnused(schema.routines!, exists);
                }
                exists.clear();
                schema = database.schemas[row["schema_name"]];
                schema_name = row["schema_name"];
            }

            delete row["schema_name"];
            if (schema) {
                exists.add(row.name);
                if (schema.routines![row.name]) {
                    schema.routines![row.name] = [
                        ...schema.routines![row.name],
                        {
                            ...row
                        }
                    ];
                }
                else {
                    schema.routines![row.name] = [{
                        ...row
                    }];
                }
            }
        }

        if (rows.length === 0 && schemaName && name) {
            delete schema?.[schemaName].routines[name];
        }

        if (rows.length === 0 && !schemaName && name) {
            for (const schema of Object.values(database.schemas).filter(s => s.default)) {
                delete schema.routines![name];
            }
        }

        if (!name && schema) {
            this.removeUnused(schema.routines!, exists);
        }
    }

    async updateColumns(progress?: (current: string) => void, schemaName?: string, name?: string): Promise<void> {
        const database = this.connectedDatabase();

        // Pobierz schematy do przetworzenia
        const schemasToProcess = schemaName
            ? [database.schemas[schemaName]]
            : Object.values(database.schemas);

        for (const schema of schemasToProcess) {
            if (!schema) {
                continue; // Jeśli schemat nie istnieje, pomiń
            }

            if (progress) {
                progress(`columns on schema: ${schema.name}`);
            }

            const { rows } = await this.client!.query(
                `select cl.relname as relation_name, 
                        json_agg(json_build_object(
                            'id', cl.oid::bigint *10000 +att.attnum, 
                            'name', att.attname, 
                            'no', att.attnum, 
                            'dataType', att.atttypid::regtype::text,
                            'displayType', pg_catalog.format_type(att.atttypid, att.atttypmod),
                            'nullable', att.attnotnull, 
                            'defaultValue', pg_catalog.pg_get_expr(def.adbin, def.adrelid),
                            'foreignKey', exists (select from pg_catalog.pg_constraint where conrelid = att.attrelid and contype='f' and att.attnum = any(conkey)),
                            'primaryKey', exists (select from pg_catalog.pg_constraint where conrelid = att.attrelid and contype='p' and att.attnum = any(conkey)),
                            'unique', exists (select from pg_catalog.pg_constraint where conrelid = att.attrelid and contype='u' and att.attnum = any(conkey)),
                            'permissions', 
                            json_build_object(
                                'select', pg_catalog.has_column_privilege(current_user, cl.oid, att.attnum, 'SELECT'),
                                'update', pg_catalog.has_column_privilege(current_user, cl.oid, att.attnum, 'UPDATE')
                            ),
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
                    and na.nspname = $1
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
    }

    async updateForeignKeys(progress?: (current: string) => void, schemaName?: string, name?: string): Promise<void> {
        const database = this.connectedDatabase();

        if (progress) {
            progress("foreign keys" + (schemaName ? (" of " + schemaName) : ""));
        }
        const { rows } = await this.client!.query(
            `select
                n.nspname as schema_name,
                cl.relname as relation_name,
                json_agg(json_build_object(
                    'id', con.oid,
                    'name', con.conname,
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
                and inh.inhrelid is null
                and (n.nspname = $1 or $1 is null)
                and (cl.relname = $2 or $2 is null)
            group by
                n.nspname, cl.relname
            order by
                schema_name, relation_name`,
            [schemaName, name]
        );

        for (const row of rows as object[] as { schema_name: string; relation_name: string; foreignKeys: api.ForeignKeyMetadata[] }[]) {
            if (database.schemas[row.schema_name] !== undefined && database.schemas[row.schema_name].relations[row.relation_name] !== undefined) {
                database.schemas[row.schema_name].relations[row.relation_name].foreignKeys = row.foreignKeys;
            }
        }
    }

    async updateIndexes(progress?: (current: string) => void, schemaName?: string, name?: string): Promise<void> {
        const database = this.connectedDatabase();

        if (progress) {
            progress("indexes" + (schemaName ? (" of " + schemaName) : ""));
        }
        const { rows } = await this.client!.query(
            `select i.schema_name, i.relation_name,
                json_agg(json_build_object(
                    'id', i.id,
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
                    and inh.inhrelid is null
                    and (n.nspname = $1 or $1 is null)
                    and (ct.relname = $2 or $2 is null)
                group by
                    n.nspname, ct.relname, ci.relname, ix.indexrelid, ix.indisunique, ix.indisprimary) i
            group by
                i.schema_name, i.relation_name
            order by
                i.schema_name, i.relation_name`,
            [schemaName, name]
        );

        for (const row of rows as object[] as { schema_name: string; relation_name: string; indexes: api.IndexMetadata[] }[]) {
            if (database.schemas[row.schema_name] !== undefined && database.schemas[row.schema_name].relations[row.relation_name] !== undefined) {
                database.schemas[row.schema_name].relations[row.relation_name].indexes = row.indexes;
            }
        }
    }

    async updatePrimaryKeys(progress?: (current: string) => void, schemaName?: string, name?: string): Promise<void> {
        const database = this.connectedDatabase();

        if (progress) {
            progress("primary keys" + (schemaName ? (" of " + schemaName) : ""));
        }
        const { rows } = await this.client!.query(
            `select
                n.nspname as schema_name,
                cl.relname as relation_name,
                json_build_object(
                    'id', con.oid,
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
                and inh.inhrelid is null
                and (n.nspname = $1 or $1 is null)
                and (cl.relname = $2 or $2 is null)
            group by
                n.nspname, cl.relname, con.oid, con.conname
            order by
                schema_name, relation_name`,
            [schemaName, name]
        );

        for (const row of rows as { schema_name: string; relation_name: string; primaryKey: api.PrimaryKeyMetadata }[]) {
            if (database.schemas[row.schema_name] !== undefined && database.schemas[row.schema_name].relations[row.relation_name] !== undefined) {
                database.schemas[row.schema_name].relations[row.relation_name].primaryKey = row.primaryKey;
            }
        }
    }

    async updateConstraints(progress?: (current: string) => void, schemaName?: string, name?: string): Promise<void> {
        const database = this.connectedDatabase();
        if (progress) {
            progress("constraints" + (schemaName ? (" of " + schemaName) : ""));
        }
        // only constraints that are not primary keys, foreign keys or (unique) indexes
        const { rows } = await this.client!.query(
            `select 
                c.schema_name,
                c.relation_name,
                json_agg(json_build_object(
                    'id', c.id,
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
                    and con.contype not in ('p', 'f', 'u') 
                    and inh.inhrelid is null
                    and (n.nspname = $1 or $1 is null)
                    and (ct.relname = $2 or $2 is null)
            ) c
            group by
                c.schema_name, c.relation_name
            order by
                c.schema_name, c.relation_name`,
            [schemaName, name]
        );

        for (const row of rows as { schema_name: string; relation_name: string; constraints: api.ConstraintMetadata[] }[]) {
            if (database.schemas[row.schema_name] !== undefined && database.schemas[row.schema_name].relations[row.relation_name] !== undefined) {
                database.schemas[row.schema_name].relations[row.relation_name].constraints = row.constraints;
            }
        }
    }

    async updateTypes(progress?: (current: string) => void, schemaName?: string, name?: string): Promise<void> {
        const database = this.connectedDatabase();

        if (progress) {
            progress("types" + (schemaName ? (" of " + schemaName) : ""));
        }
        const { rows } = await this.client!.query(
            `select
                n.nspname as schema_name,
                t.oid as id,
                t.typname as name,
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
                )) as attributes,
                json_build_object(
                    'usage', has_type_privilege(t.oid, 'USAGE')
                ) as permissions
            from
                pg_type t
                join pg_namespace n on t.typnamespace = n.oid
                left join pg_catalog.pg_class c on c.oid=t.typrelid and c.relkind <> 'c'
                left join pg_catalog.pg_type te on te.oid = t.typelem
            where
                n.nspname not ilike 'pg_toast%' and n.nspname not ilike 'pg_temp%'
                and t.typtype in ('b', 'c', 'd', 'e', 'p', 'r', 'm')
                and c.oid is null
                and te.oid is null
                and (n.nspname = $1 or $1 is null)
                and (t.typname = $2 or $2 is null)
            order by
                schema_name`,
            [schemaName, name]
        );

        const exists = new Set<string>();
        let schema: api.SchemaMetadata | undefined;
        let schema_name: string | undefined;

        for (const row of rows as api.TypeMetadata[]) {
            if (schema_name !== row["schema_name"]) {
                if (!name && schema) {
                    this.removeUnused(schema.types!, exists);
                }
                exists.clear();
                schema = database.schemas[row["schema_name"]];
                schema_name = row["schema_name"];
            }

            delete row["schema_name"];
            if (schema) {
                exists.add(row.name);
                if (schema.types![row.name]) {
                    schema.types![row.name] = {
                        ...schema.types![row.name],
                        ...row,
                    };
                }
                else {
                    schema.types![row.name] = {
                        ...row,
                    };
                }
            }
        }

        if (rows.length === 0 && schemaName && name) {
            delete schema?.[schemaName].types[name];
        }

        if (rows.length === 0 && !schemaName && name) {
            for (const schema of Object.values(database.schemas).filter(s => s.default)) {
                delete schema.types![name];
            }
        }
    }

    async updateSequence(progress?: (current: string) => void, schemaName?: string, name?: string): Promise<void> {
        if (this.version?.major !== undefined && this.version.major < 10) {
            return; // DBORG not supported versions lower than 10 for sequences
        }

        const database = this.connectedDatabase();

        if (progress) {
            progress("sequences" + (schemaName ? (" of " + schemaName) : ""));
        }
        const { rows } = await this.client!.query(
            `select
                n.nspname as schema_name,
                seq.oid as id,
                seq.relname as name,
                pg_catalog.pg_get_userbyid(seq.relowner) as owner,
                pg_catalog.obj_description(seq.oid, 'pg_class') as description,
                s.seqincrement as increment,
                s.seqmin as min,
                s.seqmax as max,
                s.seqstart as start,
                s.seqcache as cache,
                s.seqcycle as cycled,
                json_build_object(
                    'select', has_sequence_privilege(seq.oid, 'SELECT'),
                    'usage', has_sequence_privilege(seq.oid, 'USAGE'),
                    'update', has_sequence_privilege(seq.oid, 'UPDATE')
                ) as permissions
            from
                pg_class seq
                join pg_namespace n on seq.relnamespace = n.oid
                join pg_sequence s on seq.oid = s.seqrelid
            where
                seq.relkind = 'S'
                and n.nspname not ilike 'pg_toast%' and n.nspname not ilike 'pg_temp%'
                and (n.nspname = $1 or $1 is null)
                and (seq.relname = $2 or $2 is null)
            order by
                schema_name`,
            [schemaName, name]
        );

        const exists = new Set<string>();
        let schema: api.SchemaMetadata | undefined;
        let schema_name: string | undefined;

        for (const row of rows as api.SequenceMetadata[]) {
            if (schema_name !== row["schema_name"]) {
                if (!name && schema) {
                    this.removeUnused(schema.sequences!, exists);
                }
                exists.clear();
                schema = database.schemas[row["schema_name"]];
                schema_name = row["schema_name"];
            }

            delete row["schema_name"];
            if (schema) {
                exists.add(row.name);
                if (schema.sequences![row.name]) {
                    schema.sequences![row.name] = {
                        ...schema.sequences![row.name],
                        ...row,
                    };
                }
                else {
                    schema.sequences![row.name] = {
                        ...row,
                    };
                }
            }
        }

        if (rows.length === 0 && schemaName && name) {
            delete schema?.[schemaName].sequences[name];
        }

        if (rows.length === 0 && !schemaName && name) {
            for (const schema of Object.values(database.schemas).filter(s => s.default)) {
                delete schema.sequences![name];
            }
        }
    }
}
