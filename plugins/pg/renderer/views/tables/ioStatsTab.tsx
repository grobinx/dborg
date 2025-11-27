import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, IRenderedSlot, ITabSlot, ITabsSlot, ITextField } from "plugins/manager/renderer/CustomSlots";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { useTheme } from "@mui/material";
import { TableRecord } from ".";
import { Action } from "@renderer/components/CommandPalette/ActionManager";
import { icons } from "@renderer/themes/ThemeWrapper";

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
    let autoRefreshInterval = 5;
    let autoRefreshIntervalId: NodeJS.Timeout | null = null;

    const num = (v: any) => {
        const n = typeof v === 'number' ? v : Number(v);
        return isFinite(n) ? n : 0;
    };

    const calculateTimelineData = () => {
        const missingSnapshots = Math.max(0, snapshotSize - ioStatsRows.length);
        const timelineData: any[] = [];

        for (let i = 0; i < missingSnapshots; i++) {
            timelineData.push({
                snapshot: i + 1,
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
                    snapshot: missingSnapshots + index + 1,
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
                    snapshot: missingSnapshots + index + 1,
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

        return timelineData
            .slice(1)
            .map((d: any, i: number) => ({ ...d, snapshot: i + 1 }));
    };

    const renderSingleChart = (
        title: string,
        readKey: string,
        hitKey: string,
        readColor: string,
        hitColor: string
    ) => {
        const theme = useTheme();

        if (!ioStatsRows || ioStatsRows.length === 0) {
            return (
                <div style={{ padding: 16, color: theme.palette.text.secondary }}>
                    <p>{t("no-data", "No data available")}</p>
                </div>
            );
        }

        const displayData = calculateTimelineData();

        return (
            <div style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxSizing: 'border-box',
                overflow: 'hidden'
            }}>
                <h4 style={{
                    margin: '0 0 8px 0',
                    color: theme.palette.text.primary,
                    flexShrink: 0,
                    fontSize: '0.9rem'
                }}>
                    {title}
                </h4>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={displayData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                        <XAxis 
                            dataKey="snapshot" 
                            stroke={theme.palette.text.secondary}
                            style={{ fontSize: '0.75rem' }}
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
                            wrapperStyle={{ zIndex: 9999 }}
                            formatter={(value: any) => value !== null ? num(value).toLocaleString() : 'N/A'}
                            isAnimationActive={false}
                            animationDuration={0}
                        />
                        <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                        <Area
                            type="monotone"
                            dataKey={readKey}
                            stackId="1"
                            stroke={readColor}
                            fill={readColor}
                            fillOpacity={0.6}
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
                            fill={hitColor}
                            fillOpacity={0.6}
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
                        gap: 16,
                        boxSizing: 'border-box',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0
                        }}>
                            <h4 style={{
                                margin: '0 0 8px 0',
                                color: theme.palette.text.primary,
                                flexShrink: 0
                            }}>
                                {t("cache-hit-ratio", "Cache Hit Ratio (%)")}
                            </h4>
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
                            <h4 style={{
                                margin: '0 0 8px 0',
                                color: theme.palette.text.primary,
                                flexShrink: 0
                            }}>
                                {t("blocks-read-vs-hit", "Blocks Read vs Hit")}
                            </h4>
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
                        gap: 16,
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
                            theme.palette.error.light,
                            theme.palette.success.light
                        )}
                        {renderSingleChart(
                            t("toast-blocks-delta", "Toast Blocks Delta"),
                            "toastRead",
                            "toastHit",
                            theme.palette.warning.main,
                            theme.palette.primary.main
                        )}
                        {renderSingleChart(
                            t("toast-index-blocks-delta", "Toast Index Blocks Delta"),
                            "tidxRead",
                            "tidxHit",
                            theme.palette.warning.light,
                            theme.palette.primary.light
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
                }

                const { rows } = await session.query<IOStatsRecord>(
                    "select\n" +
                    "  heap_blks_read,\n" +
                    "  heap_blks_hit,\n" +
                    "  round(100.0 * heap_blks_hit / nullif(heap_blks_hit + heap_blks_read, 0), 2) as heap_hit_ratio,\n" +
                    "  idx_blks_read,\n" +
                    "  idx_blks_hit,\n" +
                    "  round(100.0 * idx_blks_hit / nullif(idx_blks_hit + idx_blks_read, 0), 2) as idx_hit_ratio,\n" +
                    "  toast_blks_read,\n" +
                    "  toast_blks_hit,\n" +
                    "  round(100.0 * toast_blks_hit / nullif(toast_blks_hit + toast_blks_read, 0), 2) as toast_hit_ratio,\n" +
                    "  tidx_blks_read,\n" +
                    "  tidx_blks_hit,\n" +
                    "  round(100.0 * tidx_blks_hit / nullif(tidx_blks_hit + tidx_blks_read, 0), 2) as tidx_hit_ratio\n" +
                    "from pg_statio_all_tables\n" +
                    "where schemaname = $1 and relname = $2;\n",
                    [selectedRow()!.schema_name, selectedRow()!.table_name]
                );
                if (rows.length > 0) {
                    ioStatsRows.push(...rows);
                    if (ioStatsRows.length > snapshotSize) {
                        ioStatsRows = ioStatsRows.slice(ioStatsRows.length - snapshotSize);
                    }
                } else {
                    ioStatsRows = [];
                }
                refresh(cid("table-io-stats-chart-slot"));
                refresh(cid("table-io-stats-timeline-chart-slot"));
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
                first: () => grid(),
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
                                label: t("hit-chart", "Hit Chart"),
                            }),
                            content: () => hitChart(),
                        },
                        {
                            id: cid("table-io-stats-hit-timeline-chart-tab"),
                            type: "tab",
                            label: () => ({
                                id: cid("table-io-stats-hit-timeline-chart-tab-label"),
                                type: "tablabel",
                                label: t("timeline-delta-chart", "Timeline Delta Chart"),
                            }),
                            content: () => ({
                                id: cid("table-io-stats-hit-timeline-chart-content"),
                                type: "tabcontent",
                                content: () => hitTimelineChart(),
                                onUnmount(refresh) {
                                    if (autoRefreshIntervalId) {
                                        clearInterval(autoRefreshIntervalId);
                                        autoRefreshIntervalId = null;
                                        refresh(cid("table-io-stats-hit-timeline-chart-toolbar"));
                                    }
                                },
                            }),
                            toolBar: {
                                id: cid("table-io-stats-hit-timeline-chart-toolbar"),
                                type: "toolbar",
                                tools: (refresh) => [
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
                                        id: cid("table-io-stats-hit-timeline-chart-refresh-interval-field"),
                                        type: "select",
                                        defaultValue: autoRefreshInterval,
                                        options: [
                                            { label: t("1-s", "1s"), value: 1 },
                                            { label: t("2-s", "2s"), value: 2 },
                                            { label: t("5-s", "5s"), value: 5 },
                                            { label: t("10-s", "10s"), value: 10 },
                                            { label: t("30-s", "30s"), value: 30 },
                                            { label: t("60-s", "60s"), value: 60 },
                                        ],
                                        onChange(value: number | null) {
                                            if (value) {
                                                autoRefreshInterval = value;
                                                // Zmień interwał odświeżania
                                                if (autoRefreshIntervalId) {
                                                    clearInterval(autoRefreshIntervalId);
                                                    autoRefreshIntervalId = setInterval(() => {
                                                        refresh(cid("table-io-stats-grid"));
                                                    }, autoRefreshInterval * 1000);
                                                }
                                            }
                                        },
                                        width: 50,
                                        tooltip: t("auto-refresh-interval", "Auto refresh interval"),
                                    },
                                    {
                                        id: cid("table-io-stats-hit-timeline-chart-start-refresh-action"),
                                        label: t("auto-refresh", "Auto refresh"),
                                        icon: () => {
                                            if (icons) {
                                                if (autoRefreshIntervalId) {
                                                    return <icons.AutoRefresh color="success" />;
                                                }
                                                return <icons.AutoRefresh color="error" />;
                                            }
                                            return null;
                                        },
                                        run: () => {
                                            if (autoRefreshIntervalId) {
                                                clearInterval(autoRefreshIntervalId);
                                                autoRefreshIntervalId = null;
                                            }
                                            else {
                                                autoRefreshIntervalId = setInterval(() => {
                                                    refresh(cid("table-io-stats-grid"));
                                                }, autoRefreshInterval * 1000);
                                            }
                                            refresh(cid("table-io-stats-hit-timeline-chart-toolbar"));
                                        },
                                    } as Action<any>
                                ]
                            },
                        },
                    ],
                }),
                autoSaveId: `table-io-stats-split-${session.profile.sch_id}`,
                secondSize: 50,
            }),
            onDeactivate(refresh) {
                if (autoRefreshIntervalId) {
                    clearInterval(autoRefreshIntervalId);
                    autoRefreshIntervalId = null;
                    refresh(cid("table-io-stats-hit-timeline-chart-toolbar"));
                }
            },
        }),
    };
};

export default ioStatsTab;