import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";

const statisticsTab = (
    session: IDatabaseSession,
    schemaName: () => string | null,
    tableName: () => string | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("statistics-tab"),
        type: "tab",
        label: {
            id: cid("statistics-tab-label"),
            type: "tablabel",
            label: t("statistics", "Statistics"),
        },
        content: {
            id: cid("statistics-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-statistics-grid"),
                type: "grid",
                mode: "defined",
                rows: async () => {
                    if (!schemaName() || !tableName()) return [];
                    const { rows } = await session.query(
                        `
select
  s.n_live_tup,
  s.n_dead_tup,
  s.n_mod_since_analyze,
  s.seq_scan,
  s.seq_tup_read,
  s.idx_scan,
  s.idx_tup_fetch,
  s.n_tup_ins,
  s.n_tup_upd,
  s.n_tup_del,
  s.n_tup_hot_upd,
  to_char(s.last_vacuum, 'YYYY-MM-DD HH24:MI:SS') as last_vacuum,
  to_char(s.last_autovacuum, 'YYYY-MM-DD HH24:MI:SS') as last_autovacuum,
  to_char(s.last_analyze, 'YYYY-MM-DD HH24:MI:SS') as last_analyze,
  to_char(s.last_autoanalyze, 'YYYY-MM-DD HH24:MI:SS') as last_autoanalyze,
  s.vacuum_count,
  s.autovacuum_count,
  s.analyze_count,
  s.autoanalyze_count
from pg_stat_user_tables s
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
                autoSaveId: `table-statistics-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default statisticsTab;