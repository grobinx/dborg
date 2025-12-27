import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "../../../../manager/renderer/CustomSlots";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { RefreshSlotFunction } from "@renderer/containers/ViewSlots/RefreshSlotContext";
import { icons } from "@renderer/themes/ThemeWrapper";

export interface SchemaRecord {
    schema_name: string;
    schema_owner: string;
    schema_size: string;
    schema_size_bytes: number;
    created_at: string | null;
    tables_count: number | null;
    views_count: number | null;
    functions_count: number | null;
    sequences_count: number | null;
    types_count: number | null;
    total_objects: number | null;
    comment: string | null;
    is_system: boolean;
    acl: SchemaAclEntry[];
    [key: string]: any;
}

export interface SchemaAclEntry {
    grantor: string;
    grantee: string;
    privilege_type: string;
    is_grantable: boolean;
    [key: string]: any;
}

export interface SchemaStatsRecord {
    tables_count: number;
    views_count: number;
    functions_count: number;
    sequences_count: number;
    types_count: number;
    total_objects: number;
    schema_size: string;
    schema_size_bytes: number;
    [key: string]: any;
}

export function schemasTab(session: IDatabaseSession): ITabSlot {
    const t = i18next.t.bind(i18next);

    let selectedRow: SchemaRecord | null = null;
    let allRows: SchemaRecord[] = [];
    const loadingStatsRow: SchemaRecord[] = [];

    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    async function getSchemaStats(schemaName: string): Promise<SchemaStatsRecord> {
        const sql = `
select
    coalesce(oc.tables_count, 0)::int as tables_count,
    coalesce(oc.views_count, 0)::int as views_count,
    coalesce(fc.functions_count, 0)::int as functions_count,
    coalesce(oc.sequences_count, 0)::int as sequences_count,
    coalesce(tc.types_count, 0)::int as types_count,
    coalesce(oc.tables_count, 0) + coalesce(oc.views_count, 0) + 
    coalesce(fc.functions_count, 0) + coalesce(oc.sequences_count, 0) + 
    coalesce(tc.types_count, 0) as total_objects,
    pg_size_pretty(sum(pg_total_relation_size(c.oid))) as schema_size,
    sum(pg_total_relation_size(c.oid))::bigint as schema_size_bytes
from pg_namespace n
left join pg_class c on c.relnamespace = n.oid and c.relkind in ('r', 'i', 't', 'm', 'S')
left join (
    select
        n.nspname as schema_name,
        count(*) filter (where c.relkind = 'r') as tables_count,
        count(*) filter (where c.relkind = 'v') as views_count,
        count(*) filter (where c.relkind = 'S') as sequences_count
    from pg_namespace n
    left join pg_class c on c.relnamespace = n.oid
    where c.relkind in ('r', 'v', 'S', 'm', 'f', 'p')
    group by n.nspname
) oc on oc.schema_name = n.nspname
left join (
    select
        n.nspname as schema_name,
        count(*) as functions_count
    from pg_namespace n
    left join pg_proc p on p.pronamespace = n.oid
    group by n.nspname
) fc on fc.schema_name = n.nspname
left join (
    select
        n.nspname as schema_name,
        count(*) as types_count
    from pg_namespace n
    left join pg_type t on t.typnamespace = n.oid
    where t.typtype in ('c', 'e', 'd')
    group by n.nspname
) tc on tc.schema_name = n.nspname
where n.nspname = $1
group by n.nspname, oc.tables_count, oc.views_count, fc.functions_count, oc.sequences_count, tc.types_count;
`;

        const { rows } = await session.query<SchemaStatsRecord>(sql, [schemaName]);
        return rows[0] || {
            tables_count: 0,
            views_count: 0,
            functions_count: 0,
            sequences_count: 0,
            types_count: 0,
            total_objects: 0,
            schema_size: "0 bytes",
            schema_size_bytes: 0,
        };
    }

    const loadingStatsText = (value: any, row: SchemaRecord) => {
        if (loadingStatsRow.includes(row)) {
            const Icon = icons!.Loading;
            return <Icon />;
        }
        return value;
    }

    return {
        id: cid("schemas-editors-tab"),
        type: "tab",
        closable: false,
        label: {
            id: cid("schemas-tab-label"),
            type: "tablabel",
            label: t("database-schemas", "Schemas"),
            icon: "SelectDatabaseSchema",
        },
        content: {
            id: cid("schemas-tab-content"),
            type: "tabcontent",
            content: {
                id: cid("schemas-editor-splitter"),
                type: "split",
                direction: "vertical",
                autoSaveId: `schemas-editor-splitter-${session.profile.sch_id}`,
                secondSize: 25,
                first: (refresh) => ({
                    id: cid("schemas-grid"),
                    type: "grid",
                    uniqueField: "schema_name",
                    rows: async () => {
                        const sql = `
select
    n.nspname as schema_name,
    pg_get_userbyid(n.nspowner) as schema_owner,
    null::text as schema_size,
    null::bigint as schema_size_bytes,
    null::timestamp as created_at,
    null::int as tables_count,
    null::int as views_count,
    null::int as functions_count,
    null::int as sequences_count,
    null::int as types_count,
    null::int as total_objects,
    d.description as comment,
    n.nspname in ('pg_catalog', 'information_schema', 'pg_toast') or 
    n.nspname like 'pg_temp%' or n.nspname like 'pg_toast_temp%' as is_system,
    coalesce(
        (
            select json_agg(row_to_json(a))
            from (
                select
                    pg_get_userbyid(grantor) as grantor,
                    pg_get_userbyid(grantee) as grantee,
                    privilege_type,
                    is_grantable
                from aclexplode(n.nspacl)
            ) a
        ),
        '[]'::json
    ) as acl
from pg_namespace n
left join pg_description d on d.objoid = n.oid and d.classoid = 'pg_namespace'::regclass
where n.nspname not like 'pg_toast%'
  and n.nspname not like 'pg_temp%'
order by 
    is_system,
    schema_name;
`;

                        const { rows } = await session.query<SchemaRecord>(sql);
                        allRows = rows;
                        return rows;
                    },
                    columns: [
                        { key: "schema_name", label: t("schema-name", "Schema Name"), dataType: "string", width: 220 },
                        { key: "schema_owner", label: t("schema-owner", "Owner"), dataType: "string", width: 160 },
                        { key: "schema_size", label: t("schema-size", "Size"), dataType: "size", width: 130, formatter: loadingStatsText },
                        { key: "total_objects", label: t("total-objects", "Total Objects"), dataType: "number", width: 130, formatter: loadingStatsText },
                        { key: "tables_count", label: t("tables-count", "Tables"), dataType: "number", width: 100, formatter: loadingStatsText },
                        { key: "views_count", label: t("views-count", "Views"), dataType: "number", width: 100, formatter: loadingStatsText },
                        { key: "sequences_count", label: t("sequences-count", "Sequences"), dataType: "number", width: 100, formatter: loadingStatsText },
                        { key: "functions_count", label: t("functions-count", "Functions"), dataType: "number", width: 100, formatter: loadingStatsText },
                        { key: "types_count", label: t("types-count", "Types"), dataType: "number", width: 100, formatter: loadingStatsText },
                        { key: "comment", label: t("comment", "Comment"), dataType: "string", width: 360 },
                    ] as ColumnDefinition[],
                    onRowSelect: (row: SchemaRecord | undefined, refresh: RefreshSlotFunction) => {
                        if (selectedRow?.schema_name !== row?.schema_name) {
                            selectedRow = row ?? null;
                            refresh(cid("schemas-editor"));
                        }
                    },
                    actions: [
                        {
                            id: "schema-stats-refresh",
                            label: t("refresh-schema-stats", "Refresh Schema Stats"),
                            keybindings: ["Space"],
                            contextMenuGroupId: "schema-stats",
                            contextMenuOrder: 1,
                            disabled: () => selectedRow === null,
                            run: async () => {
                                if (selectedRow) {
                                    const row = selectedRow;
                                    loadingStatsRow.push(row);
                                    refresh(cid("schemas-grid"), true);
                                    try {
                                        const stats = await getSchemaStats(row.schema_name);
                                        Object.assign(row, stats);
                                    } finally {
                                        const index = loadingStatsRow.indexOf(row);
                                        if (index !== -1) {
                                            loadingStatsRow.splice(index, 1);
                                        }
                                        refresh(cid("schemas-grid"), true);
                                    }
                                }
                            },
                        },
                        {
                            id: "schema-refresh-all",
                            label: t("refresh-schemas", "Refresh All Schema Stats"),
                            keybindings: ["Alt+Shift+Enter"],
                            contextMenuGroupId: "schema-stats",
                            contextMenuOrder: 2,
                            run: async () => {
                                for (const row of allRows) {
                                    loadingStatsRow.push(row);
                                    refresh(cid("schemas-grid"), true);
                                    try {
                                        const stats = await getSchemaStats(row.schema_name);
                                        Object.assign(row, stats);
                                    } finally {
                                        const index = loadingStatsRow.indexOf(row);
                                        if (index !== -1) {
                                            loadingStatsRow.splice(index, 1);
                                        }
                                        refresh(cid("schemas-grid"), true);
                                    }
                                }
                            },
                        }
                    ],
                    autoSaveId: `schemas-grid-${session.profile.sch_id}`,
                    statuses: ["data-rows"]
                } as IGridSlot),
                second: {
                    id: cid("schemas-editor"),
                    type: "editor",
                    lineNumbers: false,
                    readOnly: true,
                    miniMap: false,
                    content: async () => {
                        if (selectedRow) {
                            let ddl = "";

                            // CREATE SCHEMA
                            const { rows: createRows } = await session.query<{ source: string }>(
                                `select 'CREATE SCHEMA ' || quote_ident(nspname) || 
                                                 ' AUTHORIZATION ' || quote_ident(pg_get_userbyid(nspowner)) || ';' as source
                                                from pg_namespace
                                                where nspname = $1;`,
                                [selectedRow.schema_name]
                            );
                            if (createRows.length > 0) {
                                ddl += createRows[0].source;
                            }

                            // COMMENT
                            const { rows: commentRows } = await session.query<{ source: string }>(
                                `select 'COMMENT ON SCHEMA ' || quote_ident(nspname) || ' IS ' || 
                                                 quote_literal(description) || ';' as source
                                                from pg_namespace n
                                                join pg_description d on d.objoid = n.oid and d.classoid = 'pg_namespace'::regclass
                                                where n.nspname = $1;`,
                                [selectedRow.schema_name]
                            );
                            if (commentRows.length > 0) {
                                ddl += "\n\n" + commentRows[0].source;
                            }

                            // PRIVILEGES
                            const { rows: privRows } = await session.query<{ source: string }>(
                                `select 'GRANT ' || privilege_type || ' ON SCHEMA ' || quote_ident($1) ||
     ' TO ' || case 
         when grantee = 0 then 'PUBLIC'
         else quote_ident(pg_get_userbyid(grantee))
     end ||
     case when is_grantable then ' WITH GRANT OPTION' else '' end || ';' as source
    from pg_namespace n
    cross join aclexplode(n.nspacl)
    where n.nspname = $1
     and grantee != n.nspowner;`,
                                [selectedRow.schema_name]
                            );
                            if (privRows.length > 0) {
                                ddl += "\n\n" + privRows.map(r => r.source).join("\n");
                            }

                            return ddl || "-- No DDL found";
                        } else {
                            return "-- No schema selected";
                        }
                    },
                },
            },
        },
        toolBar: {
            id: cid("schemas-toolbar"),
            type: "toolbar",
            tools: [],
            actionSlotId: cid("schemas-grid"),
        }
    };
}
