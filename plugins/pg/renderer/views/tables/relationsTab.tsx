import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from "./tablesView";

const relationsTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("table-relations-tab"),
        type: "tab",
        label: {
            id: cid("table-relations-tab-label"),
            type: "tablabel",
            label: t("relations", "Relations"),
        },
        content: {
            id: cid("table-relations-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-relations-grid"),
                type: "grid",
                mode: "defined",
                rows: async () => {
                    if (!selectedRow()) return [];

                    const { rows } = await session.query(
                        `
with ct as (
  select c.oid, n.nspname as nsp, c.relname as rel
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = $1 and c.relname = $2
)
select *
from (
  -- FK wychodzące z bieżącej tabeli
  select
    'out'::text as direction,
    con.conname as constraint_name,
    n.nspname as from_schema_name,
    c.relname as from_table_name,
    coalesce(array_to_string(array(
      select att.attname
      from unnest(con.conkey) with ordinality k(attnum, ord)
      join pg_attribute att on att.attrelid = c.oid and att.attnum = k.attnum
      order by k.ord
    ), ', '), '') as from_columns,
    rn.nspname as to_schema_name,
    rc.relname as to_table_name,
    coalesce(array_to_string(array(
      select ratt.attname
      from unnest(con.confkey) with ordinality rk(attnum, ord)
      join pg_attribute ratt on ratt.attrelid = rc.oid and ratt.attnum = rk.attnum
      order by rk.ord
    ), ', '), '') as to_columns,
    case con.confupdtype
      when 'a' then 'no action' when 'r' then 'restrict'
      when 'c' then 'cascade'   when 'n' then 'set null'
      when 'd' then 'set default' else con.confupdtype::text end as on_update,
    case con.confdeltype
      when 'a' then 'no action' when 'r' then 'restrict'
      when 'c' then 'cascade'   when 'n' then 'set null'
      when 'd' then 'set default' else con.confdeltype::text end as on_delete,
    case con.confmatchtype
      when 'f' then 'full' when 'p' then 'partial'
      when 's' then 'simple' else con.confmatchtype::text end as match,
    con.condeferrable as deferrable,
    con.condeferred  as deferred
  from pg_constraint con
  join ct t on con.conrelid = t.oid
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_class rc on rc.oid = con.confrelid
  join pg_namespace rn on rn.oid = rc.relnamespace
  where con.contype = 'f'

  union all

  -- FK przychodzące do bieżącej tabeli
  select
    'in'::text as direction,
    con.conname as constraint_name,
    n.nspname as from_schema_name,
    c.relname as from_table_name,
    coalesce(array_to_string(array(
      select att.attname
      from unnest(con.conkey) with ordinality k(attnum, ord)
      join pg_attribute att on att.attrelid = c.oid and att.attnum = k.attnum
      order by k.ord
    ), ', '), '') as from_columns,
    t.nsp as to_schema_name,
    t.rel as to_table_name,
    coalesce(array_to_string(array(
      select ratt.attname
      from unnest(con.confkey) with ordinality rk(attnum, ord)
      join pg_attribute ratt on ratt.attrelid = t.oid and ratt.attnum = rk.attnum
      order by rk.ord
    ), ', '), '') as to_columns,
    case con.confupdtype
      when 'a' then 'no action' when 'r' then 'restrict'
      when 'c' then 'cascade'   when 'n' then 'set null'
      when 'd' then 'set default' else con.confupdtype::text end as on_update,
    case con.confdeltype
      when 'a' then 'no action' when 'r' then 'restrict'
      when 'c' then 'cascade'   when 'n' then 'set null'
      when 'd' then 'set default' else con.confdeltype::text end as on_delete,
    case con.confmatchtype
      when 'f' then 'full' when 'p' then 'partial'
      when 's' then 'simple' else con.confmatchtype::text end as match,
    con.condeferrable as deferrable,
    con.condeferred  as deferred
  from pg_constraint con
  join ct t on con.confrelid = t.oid
  join pg_class c on c.oid = con.conrelid
  join pg_namespace n on n.oid = c.relnamespace
  where con.contype = 'f'
) q
order by direction, from_schema_name, from_table_name, constraint_name;
            `,
                        [selectedRow()!.schema_name, selectedRow()!.table_name]
                    );

                    return rows;
                },
                columns: [
                    { key: "direction", label: t("direction", "Direction"), dataType: "string", width: 90 },
                    { key: "constraint_name", label: t("constraint-name", "Constraint Name"), dataType: "string", width: 220 },
                    { key: "from_schema_name", label: t("from-schema", "From Schema"), dataType: "string", width: 140 },
                    { key: "from_table_name", label: t("from-table", "From Table"), dataType: "string", width: 200 },
                    { key: "from_columns", label: t("from-columns", "From Columns"), dataType: "string", width: 240 },
                    { key: "to_schema_name", label: t("to-schema", "To Schema"), dataType: "string", width: 140 },
                    { key: "to_table_name", label: t("to-table", "To Table"), dataType: "string", width: 200 },
                    { key: "to_columns", label: t("to-columns", "To Columns"), dataType: "string", width: 240 },
                    { key: "on_update", label: t("on-update", "On Update"), dataType: "string", width: 110 },
                    { key: "on_delete", label: t("on-delete", "On Delete"), dataType: "string", width: 110 },
                    { key: "match", label: t("match", "Match"), dataType: "string", width: 90 },
                    { key: "deferrable", label: t("deferrable", "Deferrable"), dataType: "boolean", width: 110 },
                    { key: "deferred", label: t("deferred", "Initially Deferred"), dataType: "boolean", width: 140 },
                ] as ColumnDefinition[],
                autoSaveId: `table-relations-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default relationsTab;