import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";

const ioStatsTab = (
    session: IDatabaseSession,
    schemaName: () => string | null,
    tableName: () => string | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("io-stats-tab"),
        type: "tab",
        label: {
            id: cid("io-stats-tab-label"),
            type: "tablabel",
            label: t("io-stats", "I/O Stats"),
        },
        content: {
            id: cid("io-stats-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-io-stats-grid"),
                type: "grid",
                mode: "defined",
                rows: async () => {
                    if (!schemaName() || !tableName()) return [];
                    const { rows } = await session.query(
                        `
select
  schemaname,
  relname,
  heap_blks_read,
  heap_blks_hit,
  round(100.0 * heap_blks_hit / nullif(heap_blks_hit + heap_blks_read, 0), 2) as heap_hit_ratio,
  idx_blks_read,
  idx_blks_hit,
  round(100.0 * idx_blks_hit / nullif(idx_blks_hit + idx_blks_read, 0), 2) as idx_hit_ratio,
  toast_blks_read,
  toast_blks_hit,
  round(100.0 * toast_blks_hit / nullif(toast_blks_hit + toast_blks_read, 0), 2) as toast_hit_ratio,
  tidx_blks_read,
  tidx_blks_hit,
  round(100.0 * tidx_blks_hit / nullif(tidx_blks_hit + tidx_blks_read, 0), 2) as tidx_hit_ratio
from pg_statio_all_tables
where schemaname = $1 and relname = $2;
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
                autoSaveId: `table-io-stats-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default ioStatsTab;