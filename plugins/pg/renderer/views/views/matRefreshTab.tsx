import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { ViewRecord } from "./viewsView";

const matRefreshTab = (
    session: IDatabaseSession,
    selectedRow: () => ViewRecord | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        id: cid("view-mat-refresh-tab"),
        type: "tab",
        label: {
            id: cid("view-mat-refresh-tab-label"),
            type: "tablabel",
            label: t("refresh-info", "Refresh info"),
        },
        content: {
            id: cid("view-mat-refresh-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("view-mat-refresh-grid"),
                type: "grid",
                mode: "defined",
                rows: async () => {
                    const row = selectedRow();
                    if (!row) return [];

                    // detect running REFRESHs for this view
                    const target = `${row.schema_name}.${row.view_name}`;
                    const { rows: running } = await session.query<any>(
                        `
select
  pid,
  usename,
  application_name,
  state,
  query,
  age(now(), query_start) as running_for
from pg_stat_activity
where query ilike '%refresh materialized view%' and (query ilike $1 or query ilike $2)
order by query_start desc;
                        `,
                        [`%${target}%`, `%${row.view_name}%`]
                    );

                    // provide note that Postgres doesn't store historic refresh timestamps by default
                    const infoRows: any[] = [];

                    if (running.length === 0) {
                        infoRows.push({
                            key: "running",
                            label: t("running-refresh", "Running refresh"),
                            value: t("none", "None"),
                        });
                    } else {
                        // flatten running rows into the grid as separate entries
                        for (const r of running) {
                            infoRows.push({
                                key: `running-${r.pid}`,
                                label: `${t("running-refresh", "Running refresh")} (${r.pid})`,
                                value: `${r.usename} / ${r.application_name} / ${r.state}`,
                                details: r.query,
                                running_for: r.running_for,
                                pid: r.pid,
                            });
                        }
                    }

                    return infoRows;
                },
                columns: [
                    { key: "label", label: t("property", "Property"), dataType: "string", width: 260 },
                    { key: "value", label: t("value", "Value"), dataType: "string", width: 600 },
                    { key: "running_for", label: t("running-for", "Running for"), dataType: "string", width: 140 },
                    { key: "details", label: t("details", "Details"), dataType: "string", width: 800 },
                ] as ColumnDefinition[],
                // pivot: true,
                // pivotColumns: [
                //     { key: "detail", label: t("details", "Details"), width: 220, dataType: "string" },
                //     { key: "value", label: t("value", "Value"), width: 420, dataType: "string" },
                // ],
                autoSaveId: `view-mat-refresh-grid-${session.profile.sch_id}`,
            }),
        },
    };
};

export default matRefreshTab;