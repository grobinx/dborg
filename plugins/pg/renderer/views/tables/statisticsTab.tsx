import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from ".";

const statisticsTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("table-statistics-tab"),
        type: "tab",
        label: {
            id: cid("table-statistics-tab-label"),
            type: "tablabel",
            label: t("statistics", "Statistics"),
        },
        content: {
            id: cid("table-statistics-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-statistics-grid"),
                type: "grid",
                mode: "defined",
                pivot: true,
                rows: async () => {
                    if (!selectedRow()) return [];
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
  s.last_vacuum,
  s.last_autovacuum,
  s.last_analyze,
  s.last_autoanalyze,
  s.vacuum_count,
  s.autovacuum_count,
  s.analyze_count,
  s.autoanalyze_count
from pg_stat_all_tables s
where s.schemaname = $1 and s.relname = $2;
            `,
                        [selectedRow()!.schema_name, selectedRow()!.table_name]
                    );
                    return rows;
                },
                columns: [
                    { key: "n_live_tup", label: t("n-live-tup", "Live Tuples"), dataType: "number", width: 130 },
                    { key: "n_dead_tup", label: t("n-dead-tup", "Dead Tuples"), dataType: "number", width: 130 },
                    { key: "n_mod_since_analyze", label: t("n-mod-since-analyze", "Mod Since Analyze"), dataType: "number", width: 160 },
                    { key: "seq_scan", label: t("seq-scan", "Seq Scan"), dataType: "number", width: 110 },
                    { key: "seq_tup_read", label: t("seq-tup-read", "Seq Tup Read"), dataType: "number", width: 140 },
                    { key: "idx_scan", label: t("idx-scan", "Idx Scan"), dataType: "number", width: 110 },
                    { key: "idx_tup_fetch", label: t("idx-tup-fetch", "Idx Tup Fetch"), dataType: "number", width: 140 },
                    { key: "n_tup_ins", label: t("n-tup-ins", "Inserts"), dataType: "number", width: 110 },
                    { key: "n_tup_upd", label: t("n-tup-upd", "Updates"), dataType: "number", width: 110 },
                    { key: "n_tup_del", label: t("n-tup-del", "Deletes"), dataType: "number", width: 110 },
                    { key: "n_tup_hot_upd", label: t("n-tup-hot-upd", "HOT Updates"), dataType: "number", width: 130 },
                    { key: "last_vacuum", label: t("last-vacuum", "Last Vacuum"), dataType: "datetime", width: 180 },
                    { key: "last_autovacuum", label: t("last-autovacuum", "Last Autovacuum"), dataType: "datetime", width: 180 },
                    { key: "last_analyze", label: t("last-analyze", "Last Analyze"), dataType: "datetime", width: 180 },
                    { key: "last_autoanalyze", label: t("last-autoanalyze", "Last Autoanalyze"), dataType: "datetime", width: 180 },
                    { key: "vacuum_count", label: t("vacuum-count", "Vacuum Count"), dataType: "number", width: 130 },
                    { key: "autovacuum_count", label: t("autovacuum-count", "Autovacuum Count"), dataType: "number", width: 150 },
                    { key: "analyze_count", label: t("analyze-count", "Analyze Count"), dataType: "number", width: 130 },
                    { key: "autoanalyze_count", label: t("autoanalyze-count", "Autoanalyze Count"), dataType: "number", width: 160 },
                ] as ColumnDefinition[],
                autoSaveId: `table-statistics-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default statisticsTab;