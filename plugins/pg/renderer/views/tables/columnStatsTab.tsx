import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import {
    IAutoRefresh,
    IContentSlot,
    IGridSlot,
    IRenderedSlot,
    ITabSlot,
    ITabsSlot
} from "plugins/manager/renderer/CustomSlots";
import { TableRecord } from "./tablesView";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    BarChart,
    Bar
} from "recharts";
import { useTheme } from "@mui/material";
import TitleChart from "../Components/TitleChart";
import Tooltip from "../Components/Tooltip";
import Legend from "../Components/Legend";

interface ColumnStatsRow {
    attname: string;
    null_frac: number;
    n_distinct: number;
    avg_width: number;
    correlation: number;
    most_common_vals: string | null;
    most_common_freqs: string | null;
    histogram_bounds: string | null;
    snapshot?: number;
    timestamp?: number;
    [key: string]: any;
}

interface AggregatedSnapshot {
    snapshot: number;
    avgNullFrac: number;
    avgDistinctRaw: number;
    avgWidth: number;
    avgCorrelation: number;
}

const columnStatsTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null,
    cid: (id: string) => string
): ITabSlot => {
    const t = i18next.t.bind(i18next);

    // Bufor snapshotów
    let snapshots: ColumnStatsRow[][] = [];
    let aggregated: AggregatedSnapshot[] = [];
    let snapshotCounter = 0;
    let lastSelected: TableRecord | null = null;
    let snapshotSize = 20 + 1; // +1 spójnie z innymi zakładkami (pierwszy pusty / sliding)

    const num = (v: any) => {
        const n = typeof v === "number" ? v : Number(v);
        return isFinite(n) ? n : 0;
    };

    const aggregateSnapshots = () => {
        aggregated = snapshots.map(group => {
            const snapshot = group[0]?.snapshot ?? -1;
            if (group.length === 0) {
                return {
                    snapshot,
                    avgNullFrac: 0,
                    avgDistinctRaw: 0,
                    avgWidth: 0,
                    avgCorrelation: 0
                };
            }
            let sumNullFrac = 0;
            let sumDistinct = 0;
            let sumWidth = 0;
            let sumCorrelation = 0;
            group.forEach(r => {
                sumNullFrac += num(r.null_frac);
                sumDistinct += num(r.n_distinct);
                sumWidth += num(r.avg_width);
                sumCorrelation += num(r.correlation);
            });
            const len = group.length;
            return {
                snapshot,
                avgNullFrac: sumNullFrac / len,
                avgDistinctRaw: sumDistinct / len,
                avgWidth: sumWidth / len,
                avgCorrelation: sumCorrelation / len
            };
        });
    };

    const buildAggregatedTimeline = () => {
        const missingSnapshots = Math.max(0, snapshotSize - aggregated.length);
        const padded: AggregatedSnapshot[] = [];

        for (let i = 0; i < missingSnapshots; i++) {
            padded.push({
                snapshot: -1,
                avgNullFrac: null as any,
                avgDistinctRaw: null as any,
                avgWidth: null as any,
                avgCorrelation: null as any
            });
        }

        padded.push(...aggregated);
        return padded;
    };

    // Wykres: timeline agregatów
    const timelineChart = (): IRenderedSlot => ({
        id: cid("table-column-stats-timeline-chart"),
        type: "rendered",
        render: () => {
            const theme = useTheme();

            if (aggregated.length < 1) {
                return (
                    <div style={{ padding: 16, color: theme.palette.text.secondary }}>
                        {t(
                            "no-data-timeline",
                            "Not enough data for timeline (need at least 2 snapshots)"
                        )}
                    </div>
                );
            }

            const timelineData = buildAggregatedTimeline();

            return (
                <div
                    style={{
                        padding: 8,
                        height: "100%",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden"
                    }}
                >'
                    <TitleChart title={t("column-stats-timeline", "Column Stats Timeline (Averages)")} />
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={timelineData}  // ← zmień na timelineData
                            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={theme.palette.divider}
                            />
                            <XAxis
                                dataKey="snapshot"
                                stroke={theme.palette.text.secondary}
                                style={{ fontSize: "0.7rem" }}
                                tickFormatter={(v) => v === -1 ? "-" : String(v)}
                            />
                            <YAxis
                                stroke={theme.palette.text.secondary}
                                style={{ fontSize: "0.7rem" }}
                            />
                            <Tooltip />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="avgNullFrac"
                                stroke={theme.palette.info.main}
                                name={t("avg-null-frac", "Avg Null Frac")}
                                dot={false}
                                isAnimationActive={false}
                                connectNulls
                            />
                            <Line
                                type="monotone"
                                dataKey="avgCorrelation"
                                stroke={theme.palette.warning.main}
                                name={t("avg-correlation", "Avg Correlation")}
                                dot={false}
                                isAnimationActive={false}
                                connectNulls
                            />
                            <Line
                                type="monotone"
                                dataKey="avgDistinctRaw"
                                stroke={theme.palette.success.main}
                                name={t("avg-n-distinct", "Avg N Distinct")}
                                dot={false}
                                isAnimationActive={false}
                                connectNulls
                            />
                            <Line
                                type="monotone"
                                dataKey="avgWidth"
                                stroke={theme.palette.primary.main}
                                name={t("avg-width", "Avg Width")}
                                dot={false}
                                isAnimationActive={false}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            );
        }
    });

    // Wykres: bieżący rozkład (ostatni snapshot) – null_frac & |correlation|
    const currentDistributionChart = (): IRenderedSlot => ({
        id: cid("table-column-stats-current-dist-chart"),
        type: "rendered",
        render: () => {
            const theme = useTheme();

            const last = snapshots[snapshots.length - 1];
            if (!last || last.length === 0) {
                return (
                    <div style={{ padding: 16, color: theme.palette.text.secondary }}>
                        {t("no-data", "No data available")}
                    </div>
                );
            }

            const data = last.map(r => ({
                name: r.attname,
                nullFrac: num(r.null_frac),
                correlationAbs: Math.abs(num(r.correlation))
            }));

            return (
                <div
                    style={{
                        padding: 8,
                        height: "100%",
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden"
                    }}
                >
                    <TitleChart title={t("current-null-corr", "Current Null & |Correlation|")} />
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 5, right: 20, left: 40, bottom: 40 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke={theme.palette.divider}
                            />
                            <XAxis
                                dataKey="name"
                                stroke={theme.palette.text.secondary}
                                interval={0}
                                angle={-35}
                                textAnchor="end"
                                height={60}
                                style={{ fontSize: "0.7rem" }}
                            />
                            <YAxis
                                stroke={theme.palette.text.secondary}
                                style={{ fontSize: "0.7rem" }}
                            />
                            <Tooltip />
                            <Legend />
                            <Bar
                                dataKey="nullFrac"
                                fill={theme.palette.info.main}
                                name={t("null-frac", "Null Frac")}
                                isAnimationActive={false}
                            />
                            <Bar
                                dataKey="correlationAbs"
                                fill={theme.palette.warning.main}
                                name={t("corr-abs", "|Correlation|")}
                                isAnimationActive={false}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            );
        }
    });

    const grid = (): IGridSlot => ({
        id: cid("table-column-stats-grid"),
        type: "grid",
        rows: async (slotContext) => {
            if (!selectedRow()) return [];

            // Reset przy zmianie tabeli
            if (
                lastSelected?.schema_name !== selectedRow()!.schema_name ||
                lastSelected?.table_name !== selectedRow()!.table_name
            ) {
                snapshots = [];
                aggregated = [];
                snapshotCounter = 0;
                lastSelected = selectedRow();
            }

            const { rows } = await session.query<ColumnStatsRow>(
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
                [selectedRow()!.schema_name, selectedRow()!.table_name]
            );

            if (rows.length > 0) {
                const snapshotId = ++snapshotCounter;
                const stamped = rows.map(r => ({
                    ...r,
                    snapshot: snapshotId,
                    timestamp: Date.now()
                }));
                snapshots.push(stamped);
                if (snapshots.length > snapshotSize) {
                    snapshots = snapshots.slice(snapshots.length - snapshotSize);
                }
                aggregateSnapshots();
            }

            slotContext.refresh(cid("table-column-stats-timeline-chart"));
            slotContext.refresh(cid("table-column-stats-current-dist-chart"));
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
            { key: "histogram_bounds", label: t("histogram", "Histogram Bounds"), dataType: "string", width: 380 }
        ] as ColumnDefinition[],
        autoSaveId: `table-column-stats-grid-${session.profile.sch_id}`
    });

    return {
        id: cid("table-column-stats-tab"),
        type: "tab",
        label: {
            id: cid("table-column-stats-tab-label"),
            type: "tablabel",
            label: t("column-statistics", "Column Statistics")
        },
        content: {
            id: cid("table-column-stats-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-column-stats-split"),
                type: "split",
                direction: "horizontal",
                first: (): IContentSlot => ({
                    id: cid("table-column-stats-grid-content"),
                    type: "content",
                    title: () => ({
                        id: cid("table-column-stats-grid-title"),
                        type: "title",
                        title: t("column-stats-data", "Column Stats Data"),
                        toolBar: {
                            id: cid("table-column-stats-grid-toolbar"),
                            type: "toolbar",
                            tools: ([
                                {
                                    id: cid("table-column-stats-snapshot-size-field"),
                                    type: "number",
                                    defaultValue: snapshotSize - 1,
                                    onChange(value: number | null) {
                                        snapshotSize = (value ?? 10) + 1;
                                    },
                                    width: 50,
                                    min: 10,
                                    max: 200,
                                    step: 10,
                                    tooltip: t(
                                        "column-stats-snapshot-size-tooltip",
                                        "Number of snapshots to keep (10-200)"
                                    )
                                },
                                {
                                    defaultInterval: 10,
                                    intervals: [2, 5, 10, 30, 60],
                                    onTick(slotContext, _ctx) {
                                        slotContext.refresh(cid("table-column-stats-grid"));
                                    },
                                    onClear(slotContext, _ctx) {
                                        snapshots = [];
                                        aggregated = [];
                                        snapshotCounter = 0;
                                        slotContext.refresh(cid("table-column-stats-grid"));
                                    },
                                    clearOn: "start",
                                    canPause: false,
                                } as IAutoRefresh
                            ])
                        }
                    }),
                    main: () => grid()
                }),
                second: (): ITabsSlot => ({
                    id: cid("table-column-stats-charts-tabs"),
                    type: "tabs",
                    tabs: [
                        {
                            id: cid("table-column-stats-current-dist-tab"),
                            type: "tab",
                            label: {
                                id: cid("table-column-stats-current-dist-tab-label"),
                                type: "tablabel",
                                label: t("current-dist", "Current Dist")
                            },
                            content: () => currentDistributionChart()
                        },
                        {
                            id: cid("table-column-stats-timeline-tab"),
                            type: "tab",
                            label: {
                                id: cid("table-column-stats-timeline-tab-label"),
                                type: "tablabel",
                                label: t("timeline-avg", "Timeline Avg")
                            },
                            content: () => timelineChart()
                        },
                    ]
                }),
                autoSaveId: `table-column-stats-split-${session.profile.sch_id}`,
                secondSize: 55
            })
        }
    };
};

export default columnStatsTab;