import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from "./tablesView";
import { versionToNumber } from "../../../../../src/api/version";

const queryPlansTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null,
    cid: (id: string) => string
): ITabSlot => {
    const t = i18next.t.bind(i18next);

    // Check PostgreSQL version (13+ uses total_exec_time, older uses total_time)
    const versionNumber = versionToNumber(session.getVersion() || "0.0.0");
    const useExecTime = versionNumber >= 130000;

    let extensionInstalled: boolean | null = null;
    let extensionSchema: string | null = null;

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
                rows: async () => {
                    if (!selectedRow()) return [];

                    if (extensionInstalled === null || extensionSchema === null) {
                        // Check if pg_stat_statements is available
                        const { rows: extRows } = await session.query<{ extension_installed: number; extension_schema: string }>(
                            'select\n' +
                            '   (select count(0) from pg_extension where extname = \'pg_stat_statements\') as extension_installed,\n' +
                            '   (select nspname from pg_extension e join pg_namespace n on e.extnamespace = n.oid where e.extname = \'pg_stat_statements\') as extension_schema'
                        );
                        extensionInstalled = extRows[0].extension_installed > 0;
                        extensionSchema = extRows[0].extension_schema;
                    }

                    if (!extensionInstalled) {
                        return t("extension-not-installed-pg_stat_statements", "pg_stat_statements extension not installed. Run: CREATE EXTENSION pg_stat_statements;");
                    }

                    let query: string;

                    if (useExecTime) {
                        // PostgreSQL 13+
                        query = `
select
  query,
  calls,
  round(total_exec_time::numeric, 2) as total_time_ms,
  round(mean_exec_time::numeric, 2) as mean_time_ms,
  round(min_exec_time::numeric, 2) as min_time_ms,
  round(max_exec_time::numeric, 2) as max_time_ms,
  rows as total_rows,
  round((rows::numeric / nullif(calls, 0)), 2) as rows_per_call
from ${extensionSchema}.pg_stat_statements
where query ~* $1
  and query !~* 'pg_stat_statements'
order by total_exec_time desc
limit 20;
`;
                    } else {
                        // PostgreSQL 9.6-12
                        query = `
select
  query,
  calls,
  round(total_time::numeric, 2) as total_time_ms,
  round((total_time / nullif(calls, 0))::numeric, 2) as mean_time_ms,
  rows as total_rows,
  round((rows::numeric / nullif(calls, 0)), 2) as rows_per_call
from ${extensionSchema}.pg_stat_statements
where query ~* $1
  and query !~* 'pg_stat_statements'
order by total_time desc
limit 20;
`;
                    }

                    const { rows } = await session.query(query,
                        [`(from|join)\\s+["']?${selectedRow()!.schema_name}["']?\\.["']?${selectedRow()!.table_name}["']?`]
                    );

                    return rows;
                },
                columns: [
                    { key: "query", label: t("query", "Query"), dataType: "string", width: 400 },
                    { key: "calls", label: t("calls", "Calls"), dataType: "number", width: 100 },
                    { key: "total_time_ms", label: t("total-time", "Total (ms)"), dataType: "number", width: 120 },
                    { key: "mean_time_ms", label: t("mean-time", "Mean (ms)"), dataType: "number", width: 120 },
                    useExecTime ? { key: "min_time_ms", label: t("min-time", "Min (ms)"), dataType: "number", width: 110 } : null,
                    useExecTime ? { key: "max_time_ms", label: t("max-time", "Max (ms)"), dataType: "number", width: 110 } : null,
                    { key: "total_rows", label: t("total-rows", "Total Rows"), dataType: "number", width: 120 },
                    { key: "rows_per_call", label: t("rows-per-call", "Rows/Call"), dataType: "number", width: 120 },
                ].filter(Boolean) as ColumnDefinition[],
                autoSaveId: `table-query-plans-grid-${session.profile.sch_id}`,
            } as IGridSlot),
        },
    };
};

export default queryPlansTab;