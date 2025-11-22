import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";

const columnStatsTab = (
    session: IDatabaseSession,
    schemaName: () => string | null,
    tableName: () => string | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("column-stats-tab"),
        type: "tab",
        label: {
            id: cid("column-stats-tab-label"),
            type: "tablabel",
            label: t("column-statistics", "Column Statistics"),
        },
        content: {
            id: cid("column-stats-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-column-stats-grid"),
                type: "grid",
                mode: "defined",
                rows: async () => {
                    if (!schemaName() || !tableName()) return [];
                    const { rows } = await session.query(
                        `
select
  attname,
  null_frac,
  n_distinct,
  avg_width,
  correlation,
  most_common_vals::text   as most_common_vals,
  most_common_freqs::text  as most_common_freqs,
  histogram_bounds::text   as histogram_bounds
from pg_stats
where schemaname = $1 and tablename = $2
order by attname;
            `,
                        [schemaName(), tableName()]
                    );
                    return rows;
                },
                columns: [
                    { key: "attname", label: t("column", "Column"), dataType: "string", width: 220 },
                    { key: "null_frac", label: t("null-frac", "Null Frac"), dataType: "number", width: 110 },
                    { key: "n_distinct", label: t("n-distinct", "N Distinct"), dataType: "number", width: 120 },
                    { key: "avg_width", label: t("avg-width", "Avg Width"), dataType: "number", width: 110 },
                    { key: "correlation", label: t("correlation", "Correlation"), dataType: "number", width: 120 },
                    { key: "most_common_vals", label: t("mcv", "Most Common Vals"), dataType: "string", width: 380 },
                    { key: "most_common_freqs", label: t("mcf", "Most Common Freqs"), dataType: "string", width: 260 },
                    { key: "histogram_bounds", label: t("histogram", "Histogram Bounds"), dataType: "string", width: 380 },
                ] as ColumnDefinition[],
                autoSaveId: `table-column-stats-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default columnStatsTab;