import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from ".";

const queryPlansTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("table-query-plans-tab"),
        type: "tab",
        label: {
            id: cid("table-query-plans-tab-label"),
            type: "tablabel",
            label: t("query-plans", "Query Plans"),
        },
        content: {
            id: cid("table-query-plans-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-query-plans-grid"),
                type: "grid",
                mode: "defined",
                rows: async () => {
                    if (!selectedRow()) return [];

                    // Check if pg_stat_statements is available
                    const { rows: extRows } = await session.query(
                        `select 1 from pg_extension where extname = 'pg_stat_statements'`
                    );

                    if (extRows.length === 0) {
                        return {
                            info: "pg_stat_statements extension not installed. Run: CREATE EXTENSION pg_stat_statements;"
                        };
                    }

                    const { rows } = await session.query(
                        `
select
  left(query, 100) as query_short,
  calls,
  round(total_exec_time::numeric, 2) as total_time_ms,
  round(mean_exec_time::numeric, 2) as mean_time_ms,
  round(min_exec_time::numeric, 2) as min_time_ms,
  round(max_exec_time::numeric, 2) as max_time_ms,
  rows as total_rows,
  round((rows::numeric / nullif(calls, 0)), 2) as rows_per_call,
  query
from pg_stat_statements
where query ~* $1
  and query !~* 'pg_stat_statements'
order by total_exec_time desc
limit 20;
            `,
                        [`(from|join)\\s+["']?${selectedRow()!.schema_name}["']?\\.["']?${selectedRow()!.table_name}["']?`]
                    );

                    return rows;
                },
                columns: [
                    { key: "query_short", label: t("query", "Query (preview)"), dataType: "string", width: 400 },
                    { key: "calls", label: t("calls", "Calls"), dataType: "number", width: 100 },
                    { key: "total_time_ms", label: t("total-time", "Total (ms)"), dataType: "number", width: 120 },
                    { key: "mean_time_ms", label: t("mean-time", "Mean (ms)"), dataType: "number", width: 120 },
                    { key: "min_time_ms", label: t("min-time", "Min (ms)"), dataType: "number", width: 110 },
                    { key: "max_time_ms", label: t("max-time", "Max (ms)"), dataType: "number", width: 110 },
                    { key: "total_rows", label: t("total-rows", "Total Rows"), dataType: "number", width: 120 },
                    { key: "rows_per_call", label: t("rows-per-call", "Rows/Call"), dataType: "number", width: 120 },
                    { key: "query", label: t("full-query", "Full Query"), dataType: "string", width: 800 },
                ] as ColumnDefinition[],
                autoSaveId: `table-query-plans-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default queryPlansTab;