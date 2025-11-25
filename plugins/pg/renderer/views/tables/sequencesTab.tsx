import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from ".";

const sequencesTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("table-sequences-tab"),
        type: "tab",
        label: {
            id: cid("table-sequences-tab-label"),
            type: "tablabel",
            label: t("sequences", "Sequences"),
        },
        content: {
            id: cid("table-sequences-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-sequences-grid"),
                type: "grid",
                mode: "defined",
                pivot: true,
                rows: async () => {
                    if (!selectedRow()) return [];

                    const ver = session.getVersion() ?? "";
                    const major = parseInt(String(ver).match(/\d+/)?.[0] ?? "0", 10);

                    const sql10plus = `
with obj as (
  select c.oid, n.nspname as nsp, c.relname as rel
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = $1 and c.relname = $2
),
cols as (
  select
    a.attnum,
    a.attname,
    a.attidentity,
    pg_get_expr(ad.adbin, ad.adrelid) as default_expr
  from obj o
  join pg_attribute a on a.attrelid = o.oid
  left join pg_attrdef ad on ad.adrelid = a.attrelid and ad.adnum = a.attnum
  where a.attnum > 0 and not a.attisdropped
),
seqs as (
  select
    o.nsp as table_schema,
    o.rel as table_name,
    c.attname as column_name,
    case c.attidentity when 'a' then 'always' when 'd' then 'by default' else null end as identity_type,
    pg_get_expr(ad.adbin, ad.adrelid) as default_expr,
    d.deptype,
    ns.nspname as sequence_schema,
    s.relname as sequence_name,
    format('%I.%I', ns.nspname, s.relname) as sequence_fqname
  from obj o
  join cols c on true
  left join pg_attrdef ad on ad.adrelid = o.oid and ad.adnum = c.attnum
  join pg_depend d
    on d.refobjid = o.oid
   and d.refobjsubid = c.attnum
   and d.deptype in ('a','i')
  join pg_class s on s.oid = d.objid and s.relkind = 'S'
  join pg_namespace ns on ns.oid = s.relnamespace
),
enriched as (
  select
    x.*,
    ps.last_value,
    ps.start_value,
    ps.min_value,
    ps.max_value,
    ps.increment_by,
    ps.cache_size,
    ps.cycle as is_cycled
  from seqs x
  left join pg_sequences ps
    on ps.schemaname = x.sequence_schema
   and ps.sequencename = x.sequence_name
)
select
  table_schema,
  table_name,
  column_name,
  identity_type,
  (default_expr ~* 'nextval\\(') as has_nextval,
  sequence_schema,
  sequence_name,
  sequence_fqname,
  last_value,
  start_value,
  min_value,
  max_value,
  increment_by,
  cache_size,
  is_cycled
from enriched
order by column_name, sequence_schema, sequence_name;
`;

                    const sqlLegacy = `
with obj as (
  select c.oid, n.nspname as nsp, c.relname as rel
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = $1 and c.relname = $2
),
seqs as (
  select
    o.nsp as table_schema,
    o.rel as table_name,
    a.attname as column_name,
    null::text as identity_type,
    pg_get_expr(ad.adbin, ad.adrelid) as default_expr,
    ns.nspname as sequence_schema,
    s.relname as sequence_name,
    format('%I.%I', ns.nspname, s.relname) as sequence_fqname
  from obj o
  join pg_attribute a on a.attrelid = o.oid
  left join pg_attrdef ad on ad.adrelid = a.attrelid and ad.adnum = a.attnum
  join pg_depend d
    on d.refobjid = o.oid
   and d.refobjsubid = a.attnum
   and d.deptype = 'a'
  join pg_class s on s.oid = d.objid and s.relkind = 'S'
  join pg_namespace ns on ns.oid = s.relnamespace
  where a.attnum > 0 and not a.attisdropped
)
select
  table_schema,
  table_name,
  column_name,
  identity_type,
  (default_expr ~* 'nextval\\(') as has_nextval,
  sequence_schema,
  sequence_name,
  sequence_fqname,
  null::bigint       as last_value,
  null::bigint       as start_value,
  null::bigint       as min_value,
  null::bigint       as max_value,
  null::bigint       as increment_by,
  null::bigint       as cache_size,
  null::boolean      as is_cycled
from seqs
order by column_name, sequence_schema, sequence_name;
`;

                    const sql = major >= 10 ? sql10plus : sqlLegacy;
                    const { rows } = await session.query(sql, [selectedRow()!.schema_name, selectedRow()!.table_name]);
                    return rows;
                },
                columns: [
                    { key: "column_name", label: t("column", "Column"), dataType: "string", width: 200 },
                    { key: "identity_type", label: t("identity", "Identity"), dataType: "string", width: 120 },
                    { key: "has_nextval", label: t("has-nextval", "Has nextval"), dataType: "boolean", width: 110 },
                    { key: "sequence_schema", label: t("seq-schema", "Seq. Schema"), dataType: "string", width: 140 },
                    { key: "sequence_name", label: t("seq-name", "Seq. Name"), dataType: "string", width: 220 },
                    { key: "sequence_fqname", label: t("seq-fqname", "Seq. FQName"), dataType: "string", width: 260 },
                    { key: "last_value", label: t("last-value", "Last Value"), dataType: "number", width: 130 },
                    { key: "start_value", label: t("start-value", "Start"), dataType: "number", width: 110 },
                    { key: "min_value", label: t("min-value", "Min"), dataType: "number", width: 110 },
                    { key: "max_value", label: t("max-value", "Max"), dataType: "number", width: 130 },
                    { key: "increment_by", label: t("increment-by", "Increment"), dataType: "number", width: 120 },
                    { key: "cache_size", label: t("cache-size", "Cache"), dataType: "number", width: 100 },
                    { key: "is_cycled", label: t("cycle", "Cycle"), dataType: "boolean", width: 90 },
                ] as ColumnDefinition[],
                autoSaveId: `table-sequences-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default sequencesTab;