import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from "./tablesView";
import { versionToNumber } from "../../../../../src/api/version";

const partitionsTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null,
    cid: (id: string) => string,
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");

    return {
        id: cid("table-partitions-tab"),
        type: "tab",
        label: {
            id: cid("table-partitions-tab-label"),
            type: "tablabel",
            label: t("partitions", "Partitions"),
        },
        content: {
            id: cid("table-partitions-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-partitions-grid"),
                type: "grid",
                rows: async () => {
                    if (!selectedRow()) return [];

                    const sqlPg10Plus = `
with obj as (
  select c.oid, n.nspname as nsp, c.relname as rel, c.relkind, c.relpartbound
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = $1 and c.relname = $2
),
self as (
  select
    'self'::text as role,
    o.nsp as schema_name,
    o.rel as table_name,
    (o.relkind = 'p') as is_partitioned,
    case pt.partstrat when 'r' then 'range' when 'l' then 'list' when 'h' then 'hash' else null end as method,
    pg_get_partkeydef(o.oid) as part_key,
    null::text as related_schema,
    null::text as related_table,
    null::text as bound
  from obj o
  left join pg_partitioned_table pt on pt.partrelid = o.oid
),
parents as (
  select
    'parent'::text as role,
    o.nsp as schema_name,
    o.rel as table_name,
    null::boolean as is_partitioned,
    case ppt.partstrat when 'r' then 'range' when 'l' then 'list' when 'h' then 'hash' else null end as method,
    pg_get_partkeydef(p.oid) as part_key,
    pn.nspname as related_schema,
    p.relname as related_table,
    pg_get_expr(o.relpartbound, o.oid, true) as bound
  from obj o
  join pg_inherits i on i.inhrelid = o.oid
  join pg_class p on p.oid = i.inhparent
  join pg_namespace pn on pn.oid = p.relnamespace
  left join pg_partitioned_table ppt on ppt.partrelid = p.oid
),
children as (
  select
    'partition'::text as role,
    o.nsp as schema_name,
    o.rel as table_name,
    null::boolean as is_partitioned,
    null::text as method,
    null::text as part_key,
    cn.nspname as related_schema,
    c.relname as related_table,
    pg_get_expr(c.relpartbound, c.oid, true) as bound
  from obj o
  join pg_inherits i on i.inhparent = o.oid
  join pg_class c on c.oid = i.inhrelid
  join pg_namespace cn on cn.oid = c.relnamespace
)
select role, schema_name, table_name, is_partitioned, method, part_key, related_schema, related_table, bound
from (
  select 0 as ord, * from self
  union all
  select 1 as ord, * from parents
  union all
  select 2 as ord, * from children
) u
order by ord, related_schema nulls first, related_table nulls first;
`;

                    const sqlLegacy = `
with obj as (
  select c.oid, n.nspname as nsp, c.relname as rel, c.relkind
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = $1 and c.relname = $2
),
self as (
  select
    'self'::text as role,
    o.nsp as schema_name,
    o.rel as table_name,
    false as is_partitioned,
    null::text as method,
    null::text as part_key,
    null::text as related_schema,
    null::text as related_table,
    null::text as bound
  from obj o
),
parents as (
  select
    'parent'::text as role,
    o.nsp as schema_name,
    o.rel as table_name,
    null::boolean as is_partitioned,
    null::text as method,
    null::text as part_key,
    pn.nspname as related_schema,
    p.relname as related_table,
    null::text as bound
  from obj o
  join pg_inherits i on i.inhrelid = o.oid
  join pg_class p on p.oid = i.inhparent
  join pg_namespace pn on pn.oid = p.relnamespace
),
children as (
  select
    'child'::text as role,
    o.nsp as schema_name,
    o.rel as table_name,
    null::boolean as is_partitioned,
    null::text as method,
    null::text as part_key,
    cn.nspname as related_schema,
    c.relname as related_table,
    null::text as bound
  from obj o
  join pg_inherits i on i.inhparent = o.oid
  join pg_class c on c.oid = i.inhrelid
  join pg_namespace cn on cn.oid = c.relnamespace
)
select role, schema_name, table_name, is_partitioned, method, part_key, related_schema, related_table, bound
from (
  select 0 as ord, * from self
  union all
  select 1 as ord, * from parents
  union all
  select 2 as ord, * from children
) u
order by ord, related_schema nulls first, related_table nulls first;
`;

                    const { rows } = await session.query(versionNumber >= 100000 ? sqlPg10Plus : sqlLegacy, [
                        selectedRow()!.schema_name,
                        selectedRow()!.table_name,
                    ]);
                    return rows;
                },
                columns: [
                    { key: "role", label: t("role", "Role"), dataType: "string", width: 110 },
                    { key: "schema_name", label: t("schema", "Schema"), dataType: "string", width: 160 },
                    { key: "table_name", label: t("table", "Table"), dataType: "string", width: 200 },
                    { key: "is_partitioned", label: t("is-partitioned", "Is Partitioned"), dataType: "boolean", width: 130 },
                    { key: "method", label: t("method", "Method"), dataType: "string", width: 110 },
                    { key: "part_key", label: t("part-key", "Partition Key"), dataType: "string", width: 260 },
                    { key: "related_schema", label: t("related-schema", "Related Schema"), dataType: "string", width: 160 },
                    { key: "related_table", label: t("related-table", "Related Table"), dataType: "string", width: 200 },
                    { key: "bound", label: t("bound", "Bound"), dataType: "string", width: 320 },
                ] as ColumnDefinition[],
                autoSaveId: `table-partitions-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default partitionsTab;