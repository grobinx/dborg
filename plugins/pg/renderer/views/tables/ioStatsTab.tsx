import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IAutoRefresh, IContentSlot, IGridSlot, IRenderedSlot, ITabSlot, ITabsSlot } from "plugins/manager/renderer/CustomSlots";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { useTheme } from "@mui/material";
import { TableRecord } from "./tablesView";
import { Title } from "@mui/icons-material";
import TitleChart from "../Components/TitleChart";
import Tooltip from "../Components/Tooltip";
import Legend from "../Components/Legend";

// Struktura wiersza zwracanego przez zapytanie pg_statio_all_tables + wyliczone ratio
interface IOStatsRecord {
    heap_blks_read: number;
    heap_blks_hit: number;
    heap_hit_ratio: number;
    idx_blks_read: number;
    idx_blks_hit: number;
    idx_hit_ratio: number;
    toast_blks_read: number;
    toast_blks_hit: number;
    toast_hit_ratio: number;
    tidx_blks_read: number;
    tidx_blks_hit: number;
    tidx_hit_ratio: number;
    [key: string]: any;
}

const ioStatsTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;
    let ioStatsRows: IOStatsRecord[] = [];
    let lastSelectedTable: TableRecord | null = null;
    let snapshotSize = 20 + 1;
    let snapshotCounter = 0;

    const num = (v: any) => {
        const n = typeof v === 'number' ? v : Number(v);
        return isFinite(n) ? n : 0;
    };

    const calculateTimelineData = () => {
        const missingSnapshots = Math.max(0, snapshotSize - ioStatsRows.length);
        const timelineData: any[] = [];

        for (let i = 0; i < missingSnapshots; i++) {
            timelineData.push({
                snapshot: -1,
                heapRead: null,
                heapHit: null,
                idxRead: null,
                idxHit: null,
                toastRead: null,
                toastHit: null,
                tidxRead: null,
                tidxHit: null,
            });
        }

        ioStatsRows.forEach((row, index) => {
            if (index === 0) {
                timelineData.push({
                    snapshot: -1,
                    heapRead: 0,
                    heapHit: 0,
                    idxRead: 0,
                    idxHit: 0,
                    toastRead: 0,
                    toastHit: 0,
                    tidxRead: 0,
                    tidxHit: 0,
                });
            } else {
                const prev = ioStatsRows[index - 1];
                timelineData.push({
                    snapshot: row.snapshot,
                    heapRead: Math.max(0, num(row.heap_blks_read) - num(prev.heap_blks_read)),
                    heapHit: Math.max(0, num(row.heap_blks_hit) - num(prev.heap_blks_hit)),
                    idxRead: Math.max(0, num(row.idx_blks_read) - num(prev.idx_blks_read)),
                    idxHit: Math.max(0, num(row.idx_blks_hit) - num(prev.idx_blks_hit)),
                    toastRead: Math.max(0, num(row.toast_blks_read) - num(prev.toast_blks_read)),
                    toastHit: Math.max(0, num(row.toast_blks_hit) - num(prev.toast_blks_hit)),
                    tidxRead: Math.max(0, num(row.tidx_blks_read) - num(prev.tidx_blks_read)),
                    tidxHit: Math.max(0, num(row.tidx_blks_hit) - num(prev.tidx_blks_hit)),
                });
            }
        });

        return timelineData.slice(1);
    };

    const calculateIncrementalData = () => {
        const deltas = calculateTimelineData();
        if (deltas.length === 0) return [];

        let heapReadSum = 0, heapHitSum = 0;
        let idxReadSum = 0, idxHitSum = 0;
        let toastReadSum = 0, toastHitSum = 0;
        let tidxReadSum = 0, tidxHitSum = 0;

        return deltas.map(d => {
            heapReadSum += num(d.heapRead ?? 0);
            heapHitSum += num(d.heapHit ?? 0);
            idxReadSum += num(d.idxRead ?? 0);
            idxHitSum += num(d.idxHit ?? 0);
            toastReadSum += num(d.toastRead ?? 0);
            toastHitSum += num(d.toastHit ?? 0);
            tidxReadSum += num(d.tidxRead ?? 0);
            tidxHitSum += num(d.tidxHit ?? 0);

            return {
                snapshot: d.snapshot, // wykorzystuje realny `snapshot` (lub -1 dla braków)
                heapReadC: heapReadSum,
                heapHitC: heapHitSum,
                idxReadC: idxReadSum,
                idxHitC: idxHitSum,
                toastReadC: toastReadSum,
                toastHitC: toastHitSum,
                tidxReadC: tidxReadSum,
                tidxHitC: tidxHitSum,
            };
        });
    };

    const renderSingleChart = (
        title: string,
        readKey: string,
        hitKey: string,
        readColor: string,
        hitColor: string,
        dataFactory?: () => any[]
    ) => {
        const theme = useTheme();

        if (!ioStatsRows || ioStatsRows.length === 0) {
            return (
                <div style={{ padding: 16, color: theme.palette.text.secondary }}>
                    <p>{t("no-data", "No data available")}</p>
                </div>
            );
        }

        const displayData = (dataFactory ? dataFactory() : calculateTimelineData());

        return (
            <div style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}>
                <TitleChart title={title} variant="body1" />
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={displayData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <defs>
                        <linearGradient id={`gradient-${readKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={readColor} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={readColor} stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id={`gradient-${hitKey}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={hitColor} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={hitColor} stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                        dataKey="snapshot"
                        stroke={theme.palette.text.secondary}
                        style={{ fontSize: '0.75rem' }}
                        tickFormatter={(value) => value === -1 ? "-" : value.toString()}
                    />
                    <YAxis
                        stroke={theme.palette.text.secondary}
                        style={{ fontSize: '0.75rem' }}
                        tickFormatter={(value) => {
                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                            if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                            return value.toString();
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: theme.palette.background.tooltip,
                            border: `1px solid ${theme.palette.divider}`
                        }}
                        formatter={(value: any) => value !== null ? num(value).toLocaleString() : 'N/A'}
                    />
                    <Legend />
                    <Area
                        type="monotone"
                        dataKey={readKey}
                        stackId="1"
                        stroke={readColor}
                        fill={`url(#gradient-${readKey})`}
                        fillOpacity={1}
                        name={t("read", "Read")}
                        isAnimationActive={false}
                        animationDuration={0}
                        connectNulls
                    />
                    <Area
                        type="monotone"
                        dataKey={hitKey}
                        stackId="1"
                        stroke={hitColor}
                        fill={`url(#gradient-${hitKey})`}
                        fillOpacity={1}
                        name={t("hit", "Hit")}
                        isAnimationActive={false}
                        animationDuration={0}
                        connectNulls
                    />
                </AreaChart>
                </ResponsiveContainer>
            </div>
        );
    };

    const hitChart = (): IRenderedSlot => {
        return {
            id: cid("table-io-stats-chart-slot"),
            type: "rendered",
            render: () => {
                const theme = useTheme();

                if (!ioStatsRows || ioStatsRows.length === 0) {
                    return (
                        <div style={{ padding: 16, color: theme.palette.text.secondary }}>
                            <p>{t("no-data", "No data available")}</p>
                        </div>
                    );
                }

                const row = ioStatsRows[ioStatsRows.length - 1];

                const hitRatioData = [
                    { name: 'Heap', ratio: num(row.heap_hit_ratio) },
                    { name: 'Index', ratio: num(row.idx_hit_ratio) },
                    { name: 'Toast', ratio: num(row.toast_hit_ratio) },
                    { name: 'Toast Idx', ratio: num(row.tidx_hit_ratio) },
                ];

                const readHitData = [
                    { name: 'Heap', read: num(row.heap_blks_read), hit: num(row.heap_blks_hit) },
                    { name: 'Index', read: num(row.idx_blks_read), hit: num(row.idx_blks_hit) },
                    { name: 'Toast', read: num(row.toast_blks_read), hit: num(row.toast_blks_hit) },
                    { name: 'Toast Idx', read: num(row.tidx_blks_read), hit: num(row.tidx_blks_hit) },
                ];

                const getBarColor = (ratio: number) => {
                    if (ratio >= 95) return theme.palette.success.main;
                    if (ratio >= 80) return theme.palette.warning.main;
                    return theme.palette.error.main;
                };

                return (
                    <div style={{
                        padding: 8,
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        boxSizing: 'border-box',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0
                        }}>
                            <TitleChart title={t("cache-hit-ratio", "Cache Hit Ratio (%)")} variant="body1" />
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={hitRatioData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                                    <YAxis domain={[0, 100]} stroke={theme.palette.text.secondary} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: theme.palette.background.tooltip,
                                            border: `1px solid ${theme.palette.divider}`
                                        }}
                                        wrapperStyle={{ zIndex: 9999 }}
                                        isAnimationActive={false}
                                        animationDuration={0}
                                    />
                                    <Bar
                                        dataKey="ratio"
                                        fill={theme.palette.primary.main}
                                        name={t("hit-ratio", "Hit Ratio %")}
                                        isAnimationActive={false}
                                        animationDuration={0}
                                    >
                                        {hitRatioData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getBarColor(entry.ratio)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0
                        }}>
                            <TitleChart title={t("blocks-read-vs-hit", "Blocks Read vs Hit")} variant="body1" />
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={readHitData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                    <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                                    <YAxis
                                        stroke={theme.palette.text.secondary}
                                        tickFormatter={(value) => {
                                            if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}G`;
                                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                            if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                                            return value.toString();
                                        }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: theme.palette.background.tooltip,
                                            border: `1px solid ${theme.palette.divider}`
                                        }}
                                        wrapperStyle={{ zIndex: 9999 }}
                                        formatter={(value: any) => num(value).toLocaleString()}
                                        isAnimationActive={false}
                                        animationDuration={0}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="read"
                                        fill={theme.palette.error.main}
                                        name={t("read", "Read")}
                                        isAnimationActive={false}
                                        animationDuration={0}
                                    />
                                    <Bar
                                        dataKey="hit"
                                        fill={theme.palette.success.main}
                                        name={t("hit", "Hit")}
                                        isAnimationActive={false}
                                        animationDuration={0}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            }
        };
    }

    const hitTimelineChart = (): IRenderedSlot => {
        return {
            id: cid("table-io-stats-timeline-chart-slot"),
            type: "rendered",
            render: () => {
                const theme = useTheme();

                if (!ioStatsRows || ioStatsRows.length === 0) {
                    return (
                        <div style={{ padding: 16, color: theme.palette.text.secondary }}>
                            <p>{t("no-data", "No data available")}</p>
                        </div>
                    );
                }

                return (
                    <div style={{
                        padding: 8,
                        height: '100%',
                        width: '100%',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gridTemplateRows: '1fr 1fr',
                        gap: 8,
                        boxSizing: 'border-box',
                        overflow: 'hidden'
                    }}>
                        {renderSingleChart(
                            t("heap-blocks-delta", "Heap Blocks Delta"),
                            "heapRead",
                            "heapHit",
                            theme.palette.error.main,
                            theme.palette.success.main
                        )}
                        {renderSingleChart(
                            t("index-blocks-delta", "Index Blocks Delta"),
                            "idxRead",
                            "idxHit",
                            theme.palette.error.main,
                            theme.palette.success.main
                        )}
                        {renderSingleChart(
                            t("toast-blocks-delta", "Toast Blocks Delta"),
                            "toastRead",
                            "toastHit",
                            theme.palette.error.main,
                            theme.palette.success.main
                        )}
                        {renderSingleChart(
                            t("toast-index-blocks-delta", "Toast Index Blocks Delta"),
                            "tidxRead",
                            "tidxHit",
                            theme.palette.error.main,
                            theme.palette.success.main
                        )}
                    </div>
                );
            }
        };
    };

    const incrementalTimelineChart = (): IRenderedSlot => {
        return {
            id: cid("table-io-stats-incremental-chart-slot"),
            type: "rendered",
            render: () => {
                const theme = useTheme();

                if (!ioStatsRows || ioStatsRows.length === 0) {
                    return (
                        <div style={{ padding: 16, color: theme.palette.text.secondary }}>
                            <p>{t("no-data", "No data available")}</p>
                        </div>
                    );
                }

                // Używamy tego samego layoutu co timeline (4 kafle)
                return (
                    <div style={{
                        padding: 8,
                        height: '100%',
                        width: '100%',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gridTemplateRows: '1fr 1fr',
                        gap: 8,
                        boxSizing: 'border-box',
                        overflow: 'hidden'
                    }}>
                        {renderSingleChart(
                            t("heap-blocks-cumulative", "Heap Blocks Cumulative"),
                            "heapReadC",
                            "heapHitC",
                            theme.palette.error.main,
                            theme.palette.success.main,
                            calculateIncrementalData
                        )}
                        {renderSingleChart(
                            t("index-blocks-cumulative", "Index Blocks Cumulative"),
                            "idxReadC",
                            "idxHitC",
                            theme.palette.error.main,
                            theme.palette.success.main,
                            calculateIncrementalData
                        )}
                        {renderSingleChart(
                            t("toast-blocks-cumulative", "Toast Blocks Cumulative"),
                            "toastReadC",
                            "toastHitC",
                            theme.palette.error.main,
                            theme.palette.success.main,
                            calculateIncrementalData
                        )}
                        {renderSingleChart(
                            t("toast-index-blocks-cumulative", "Toast Index Blocks Cumulative"),
                            "tidxReadC",
                            "tidxHitC",
                            theme.palette.error.main,
                            theme.palette.success.main,
                            calculateIncrementalData
                        )}
                    </div>
                );
            }
        };
    };

    const grid = (): IGridSlot => {
        return {
            id: cid("table-io-stats-grid"),
            type: "grid",
            mode: "defined",
            pivot: true,
            rows: async (refresh) => {
                if (!selectedRow()) return [];

                if (lastSelectedTable?.schema_name !== selectedRow()!.schema_name ||
                    lastSelectedTable?.table_name !== selectedRow()!.table_name) {
                    ioStatsRows = [];
                    lastSelectedTable = selectedRow();
                    snapshotCounter = 0;
                }

                const { rows } = await session.query<IOStatsRecord>(
`select
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
from 
    pg_statio_all_tables
where 
    schemaname = $1 and relname = $2;`,
                    [selectedRow()!.schema_name, selectedRow()!.table_name]
                );
                if (rows.length > 0) {
                    ioStatsRows.push(...rows.map(r => ({ ...r, snapshot: snapshotCounter++ })));
                    if (ioStatsRows.length > snapshotSize) {
                        ioStatsRows = ioStatsRows.slice(ioStatsRows.length - snapshotSize);
                    }
                }
                refresh(cid("table-io-stats-chart-slot"));
                refresh(cid("table-io-stats-timeline-chart-slot"));
                refresh(cid("table-io-stats-incremental-chart-slot"));
                return rows;
            },
            columns: [
                { key: "heap_blks_read", label: t("heap-read", "Heap Read"), dataType: "bigint", width: 130 },
                { key: "heap_blks_hit", label: t("heap-hit", "Heap Hit"), dataType: "bigint", width: 130 },
                { key: "heap_hit_ratio", label: t("heap-ratio", "Heap %"), dataType: "decimal", width: 100 },
                { key: "idx_blks_read", label: t("idx-read", "Idx Read"), dataType: "bigint", width: 130 },
                { key: "idx_blks_hit", label: t("idx-hit", "Idx Hit"), dataType: "bigint", width: 130 },
                { key: "idx_hit_ratio", label: t("idx-ratio", "Idx %"), dataType: "decimal", width: 100 },
                { key: "toast_blks_read", label: t("toast-read", "Toast Read"), dataType: "bigint", width: 130 },
                { key: "toast_blks_hit", label: t("toast-hit", "Toast Hit"), dataType: "bigint", width: 130 },
                { key: "toast_hit_ratio", label: t("toast-ratio", "Toast %"), dataType: "decimal", width: 100 },
                { key: "tidx_blks_read", label: t("tidx-read", "TIdx Read"), dataType: "bigint", width: 130 },
                { key: "tidx_blks_hit", label: t("tidx-hit", "TIdx Hit"), dataType: "bigint", width: 130 },
                { key: "tidx_hit_ratio", label: t("tidx-ratio", "TIdx %"), dataType: "decimal", width: 100 },
            ] as ColumnDefinition[],
            pivotColumns: [
                { key: "name", label: t("name", "Name"), dataType: "string", width: 120 },
                { key: "value", label: t("value", "Value"), dataType: "string", width: 200 },
            ],
            autoSaveId: `table-io-stats-grid-${session.profile.sch_id}`,
        };
    };

    return {
        id: cid("table-io-stats-tab"),
        type: "tab",
        label: () => ({
            id: cid("table-io-stats-tab-label"),
            type: "tablabel",
            label: t("io-stats", "I/O Stats"),
        }),
        content: () => ({
            id: cid("table-io-stats-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-io-stats-split"),
                type: "split",
                direction: "horizontal",
                first: (): IContentSlot => ({
                    id: cid("table-io-stats-grid-content-slot"),
                    type: "content",
                    title: () => ({
                        id: cid("table-io-stats-grid-title"),
                        type: "title",
                        title: t("io-stats-data", "I/O Stats Data"),
                        toolBar: {
                            id: cid("table-io-stats-grid-toolbar"),
                            type: "toolbar",
                            tools: ([
                                {
                                    id: cid("table-io-stats-hit-timeline-chart-snapshot-size-field"),
                                    type: "number",
                                    defaultValue: snapshotSize - 1,
                                    onChange(value: number | null) {
                                        snapshotSize = (value ?? 10) + 1;
                                    },
                                    width: 50,
                                    min: 10,
                                    max: 200,
                                    step: 10,
                                    tooltip: t("io-stats-timeline-snapshot-size-tooltip", "Number of snapshots to keep for timeline charts (10-200)"),
                                },
                                {
                                    onTick(refresh) {
                                        refresh(cid("table-io-stats-grid"));
                                    },
                                    onClear(refresh) {
                                        ioStatsRows = [];
                                        snapshotCounter = 0;
                                        refresh(cid("table-io-stats-grid"));
                                    },
                                    clearOn: "start",
                                    canPause: false,
                                } as IAutoRefresh,
                            ])
                        },
                    }),
                    main: () => grid()
                }),
                second: (): ITabsSlot => ({
                    id: cid("table-io-stats-charts-tabs"),
                    type: "tabs",
                    tabs: [
                        {
                            id: cid("table-io-stats-hit-chart-tab"),
                            type: "tab",
                            label: () => ({
                                id: cid("table-io-stats-hit-chart-tab-label"),
                                type: "tablabel",
                                label: t("hit-chart", "Hit"),
                            }),
                            content: () => hitChart(),
                        },
                        {
                            id: cid("table-io-stats-hit-timeline-chart-tab"),
                            type: "tab",
                            label: () => ({
                                id: cid("table-io-stats-hit-timeline-chart-tab-label"),
                                type: "tablabel",
                                label: t("timeline-delta-chart", "Timeline Delta"),
                            }),
                            content: () => ({
                                id: cid("table-io-stats-hit-timeline-chart-content"),
                                type: "tabcontent",
                                content: () => hitTimelineChart(),
                            }),
                        },
                        {
                            id: cid("table-io-stats-incremental-chart-tab"),
                            type: "tab",
                            label: () => ({
                                id: cid("table-io-stats-incremental-chart-tab-label"),
                                type: "tablabel",
                                label: t("timeline-cumulative-chart", "Timeline Cumulative"),
                            }),
                            content: () => ({
                                id: cid("table-io-stats-incremental-chart-content"),
                                type: "tabcontent",
                                content: () => incrementalTimelineChart(),
                            }),
                        },
                    ],
                }),
                autoSaveId: `table-io-stats-split-${session.profile.sch_id}`,
                secondSize: 50,
            }),
        }),
    };
};

export default ioStatsTab;