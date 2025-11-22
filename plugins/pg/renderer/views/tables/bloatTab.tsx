import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";

const bloatTab = (
    session: IDatabaseSession,
    schemaName: () => string | null,
    tableName: () => string | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("bloat-tab"),
        type: "tab",
        label: {
            id: cid("bloat-tab-label"),
            type: "tablabel",
            label: t("bloat", "Bloat"),
        },
        content: {
            id: cid("bloat-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-bloat-grid"),
                type: "grid",
                mode: "defined",
                rows: async () => {
                    if (!schemaName() || !tableName()) return [];
                    const { rows } = await session.query(
                        `
select
  current_database() as database_name,
  s.schemaname as schema_name,
  s.relname as table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(s.schemaname)||'.'||quote_ident(s.relname))) as total_size,
  s.n_live_tup,
  s.n_dead_tup,
  round(100.0 * s.n_dead_tup / nullif(s.n_live_tup + s.n_dead_tup, 0), 2) as dead_tup_pct,
  to_char(s.last_vacuum, 'YYYY-MM-DD HH24:MI:SS') as last_vacuum,
  to_char(s.last_autovacuum, 'YYYY-MM-DD HH24:MI:SS') as last_autovacuum,
  (50 + 0.2 * s.n_live_tup)::bigint as autovacuum_threshold,
  case 
    when c.relpages > 0 and s.n_live_tup > 0 then
      greatest(0, 
        (c.relpages - ceil(s.n_live_tup::numeric * 
          coalesce((select sum(avg_width) from pg_stats where schemaname = s.schemaname and tablename = s.relname), 100) 
          / current_setting('block_size')::numeric
        )::bigint
      ) * current_setting('block_size')::bigint)
    else 0
  end as bloat_bytes,
  case 
    when c.relpages > 0 then
      round(100.0 * greatest(0, 
        (c.relpages - ceil(s.n_live_tup::numeric * 
          coalesce((select sum(avg_width) from pg_stats where schemaname = s.schemaname and tablename = s.relname), 100) 
          / current_setting('block_size')::numeric
        )::bigint
      )) / nullif(c.relpages, 0), 2)
    else 0
  end as bloat_pct,
  pg_size_pretty(
    case 
      when c.relpages > 0 and s.n_live_tup > 0 then
        greatest(0, 
          (c.relpages - ceil(s.n_live_tup::numeric * 
            coalesce((select sum(avg_width) from pg_stats where schemaname = s.schemaname and tablename = s.relname), 100) 
            / current_setting('block_size')::numeric
          )::bigint
        ) * current_setting('block_size')::bigint)
      else 0
    end
  ) as bloat_size,
  case 
    when s.n_dead_tup > (50 + 0.2 * s.n_live_tup) * 0.5 and s.n_dead_tup > 100 then 'vacuum recommended'
    when s.n_dead_tup > (50 + 0.2 * s.n_live_tup) and s.n_dead_tup > 1000 then 'vacuum critical'
    when s.n_dead_tup::float / nullif(s.n_live_tup + s.n_dead_tup, 0) > 0.25 then 'high bloat'
    when c.relpages > 0 and 
         100.0 * greatest(0, 
           (c.relpages - ceil(s.n_live_tup::numeric * 
             coalesce((select sum(avg_width) from pg_stats where schemaname = s.schemaname and tablename = s.relname), 100) 
             / current_setting('block_size')::numeric
           )::bigint
         )) / nullif(c.relpages, 0) > 30 then 'high bloat (pages)'
    else 'ok'
  end as bloat_status
from pg_stat_all_tables s
join pg_class c on c.oid = (quote_ident(s.schemaname)||'.'||quote_ident(s.relname))::regclass
where s.schemaname = $1 and s.relname = $2;
            `,
                        [schemaName(), tableName()]
                    );
                    if (rows.length === 0) return [];
                    const row = rows[0];
                    return Object.entries(row).map(([name, value]) => ({
                        name: t(name, name.replace(/_/g, " ")),
                        value: value != null ? String(value) : "",
                    }));
                },
                columns: [
                    { key: "name", label: t("name", "Name"), dataType: "string", width: 220 },
                    { key: "value", label: t("value", "Value"), dataType: "string", width: 300 },
                ] as ColumnDefinition[],
                autoSaveId: `table-bloat-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default bloatTab;