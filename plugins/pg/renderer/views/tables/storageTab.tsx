import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";

const storageTab = (
    session: IDatabaseSession,
    schemaName: () => string | null,
    tableName: () => string | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("storage-tab"),
        type: "tab",
        label: {
            id: cid("storage-tab-label"),
            type: "tablabel",
            label: t("storage", "Storage"),
        },
        content: {
            id: cid("storage-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-storage-grid"),
                type: "grid",
                mode: "defined",
                rows: async () => {
                    if (!schemaName() || !tableName()) return [];
                    const { rows } = await session.query(
                        `
select
  c.relkind,
  case c.relkind
    when 'r' then 'table'
    when 'p' then 'partitioned table'
    when 'i' then 'index'
    when 'S' then 'sequence'
    when 't' then 'toast'
    when 'm' then 'materialized view'
    when 'v' then 'view'
    when 'f' then 'foreign table'
    else c.relkind::text
  end as relkind_text,
  coalesce(array_to_string(c.reloptions, ', '), '') as reloptions,
  pg_relation_size(c.oid) as heap_bytes,
  pg_size_pretty(pg_relation_size(c.oid)) as heap,
  case when c.reltoastrelid <> 0 then pg_total_relation_size(c.reltoastrelid) else 0 end as toast_bytes,
  case when c.reltoastrelid <> 0 then pg_size_pretty(pg_total_relation_size(c.reltoastrelid)) else '0 bytes' end as toast,
  pg_indexes_size(c.oid) as indexes_bytes,
  pg_size_pretty(pg_indexes_size(c.oid)) as indexes,
  pg_total_relation_size(c.oid) as total_bytes,
  pg_size_pretty(pg_total_relation_size(c.oid)) as total,
  case 
    when s.n_live_tup > 0 then round(pg_relation_size(c.oid)::numeric / s.n_live_tup, 2)
    else null
  end as avg_row_size_bytes,
  case 
    when s.n_live_tup > 0 then pg_size_pretty(round(pg_relation_size(c.oid)::numeric / s.n_live_tup)::bigint)
    else null
  end as avg_row_size
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_stat_all_tables s on s.schemaname = n.nspname and s.relname = c.relname
where n.nspname = $1 and c.relname = $2;
            `,
                        [schemaName(), tableName()]
                    );
                    if (rows.length === 0) return [];
                    const row = rows[0];
                    return Object.entries(row).map(([name, value]) => ({
                        name: t(name, name.replace(/_/g, " ")),
                        value,
                    }));
                },
                columns: [
                    { key: "name", label: t("name", "Name"), dataType: "string", width: 150 },
                    { key: "value", label: t("value", "Value"), dataType: "string", width: 300 },
                ] as ColumnDefinition[],
                autoSaveId: `table-storage-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default storageTab;