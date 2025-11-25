import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, IRenderedSlot, ITabSlot, ITabsSlot, ITextField } from "plugins/manager/renderer/CustomSlots";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { useTheme } from "@mui/material";
import { TableRecord } from ".";
import { Action } from "@renderer/components/CommandPalette/ActionManager";

// Struktura wiersza zwracanego przez zapytanie pg_statio_all_tables + wyliczone ratio
interface IOStatsRecord {
    schemaname: string;
    relname: string;
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
    const autoRefreshInterval = 1; // 1 sekund
    let autoRefreshIntervalId: NodeJS.Timeout | null = null;

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

                const num = (v: any) => {
                    const n = typeof v === 'number' ? v : Number(v);
                    return isFinite(n) ? n : 0;
                };

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

                const num = (v: any) => {
                    const n = typeof v === 'number' ? v : Number(v);
                    return isFinite(n) ? n : 0;
                };

                // Oblicz ile brakuje snapshotów do pełnego rozmiaru
                const missingSnapshots = Math.max(0, snapshotSize - ioStatsRows.length);

                // Wypełnij brakujące snapshoty na początku
                const timelineData: any[] = [];
                for (let i = 0; i < missingSnapshots; i++) {
                    timelineData.push({
                        snapshot: i + 1,
                        heapRatio: null,
                        idxRatio: null,
                        toastRatio: null,
                        tidxRatio: null,
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

                // Oblicz różnice między kolejnymi odczytami
                ioStatsRows.forEach((row, index) => {
                    if (index === 0) {
                        // Pierwszy snapshot - brak różnic
                        timelineData.push({
                            snapshot: missingSnapshots + index + 1,
                            heapRatio: num(row.heap_hit_ratio),
                            idxRatio: num(row.idx_hit_ratio),
                            toastRatio: num(row.toast_hit_ratio),
                            tidxRatio: num(row.tidx_hit_ratio),
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
                            heapRatio: num(row.heap_hit_ratio),
                            idxRatio: num(row.idx_hit_ratio),
                            toastRatio: num(row.toast_hit_ratio),
                            tidxRatio: num(row.tidx_hit_ratio),
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

                // Usuń pierwszy snapshot (z zerową deltą) i ponumeruj od 1
                const displayData = timelineData
                    .slice(1)
                    .map((d: any, i: number) => ({ ...d, snapshot: i + 1 }));

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
                        {/* Wykres Read vs Hit w czasie (delta - różnice) */}
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
                                {t("blocks-delta-timeline", "Blocks Delta (Read/Hit)")}
                            </h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={displayData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                    <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} />
                                    <YAxis
                                        stroke={theme.palette.text.secondary}
                                        tickFormatter={(value) => {
                                            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                                            if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                                            return value.toString();
                                        }}
                                        label={{
                                            value: t("blocks-delta", "Δ Blocks"),
                                            angle: -90,
                                            position: 'insideLeft',
                                            fill: theme.palette.text.secondary
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
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="heapRead"
                                        stackId="1"
                                        stroke={theme.palette.error.dark}
                                        fill={theme.palette.error.dark}
                                        fillOpacity={0.6}
                                        name={t("heap-read-delta", "Heap Read")}
                                        isAnimationActive={false}
                                        animationDuration={0}
                                        connectNulls
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="heapHit"
                                        stackId="1"
                                        stroke={theme.palette.success.dark}
                                        fill={theme.palette.success.dark}
                                        fillOpacity={0.6}
                                        name={t("heap-hit-delta", "Heap Hit")}
                                        isAnimationActive={false}
                                        animationDuration={0}
                                        connectNulls
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="idxRead"
                                        stackId="2"
                                        stroke={theme.palette.error.light}
                                        fill={theme.palette.error.light}
                                        fillOpacity={0.4}
                                        name={t("idx-read-delta", "Idx Read")}
                                        isAnimationActive={false}
                                        animationDuration={0}
                                        connectNulls
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="idxHit"
                                        stackId="2"
                                        stroke={theme.palette.success.light}
                                        fill={theme.palette.success.light}
                                        fillOpacity={0.4}
                                        name={t("idx-hit-delta", "Idx Hit")}
                                        isAnimationActive={false}
                                        animationDuration={0}
                                        connectNulls
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="toastRead"
                                        stackId="3"
                                        stroke={theme.palette.warning.dark}
                                        fill={theme.palette.warning.dark}
                                        fillOpacity={0.5}
                                        name={t("toast-read-delta", "Toast Read")}
                                        isAnimationActive={false}
                                        animationDuration={0}
                                        connectNulls
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="toastHit"
                                        stackId="3"
                                        stroke={theme.palette.primary.dark}
                                        fill={theme.palette.primary.dark}
                                        fillOpacity={0.5}
                                        name={t("toast-hit-delta", "Toast Hit")}
                                        isAnimationActive={false}
                                        animationDuration={0}
                                        connectNulls
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="tidxRead"
                                        stackId="4"
                                        stroke={theme.palette.warning.light}
                                        fill={theme.palette.warning.light}
                                        fillOpacity={0.5}
                                        name={t("tidx-read-delta", "Toast Idx Read")}
                                        isAnimationActive={false}
                                        animationDuration={0}
                                        connectNulls
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="tidxHit"
                                        stackId="4"
                                        stroke={theme.palette.primary.light}
                                        fill={theme.palette.primary.light}
                                        fillOpacity={0.5}
                                        name={t("tidx-hit-delta", "Toast Idx Hit")}
                                        isAnimationActive={false}
                                        animationDuration={0}
                                        connectNulls
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
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
                    "  schemaname,\n" +
                    "  relname,\n" +
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
                { key: "schemaname", label: t("schema", "Schema"), dataType: "string", width: 150 },
                { key: "relname", label: t("table", "Table"), dataType: "string", width: 200 },
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
                                label: t("timeline-chart", "Timeline Chart"),
                            }),
                            content: () => ({
                                id: cid("table-io-stats-hit-timeline-chart-content"),
                                type: "tabcontent",
                                content: () => hitTimelineChart(),
                                onUnmount() {
                                    if (autoRefreshIntervalId) {
                                        clearInterval(autoRefreshIntervalId);
                                        autoRefreshIntervalId = null;
                                    }
                                },
                            }),
                            actions: (refresh) => [
                                {
                                    id: cid("table-io-stats-hit-timeline-chart-snapshot-size-action"),
                                    type: "number",
                                    defaultValue: String(snapshotSize - 1),
                                    onChange(value: string) {
                                        const num = Number(value);
                                        if (isNaN(num) || num < 10 || num > 200) {
                                            return;
                                        }
                                        snapshotSize = num + 1;
                                    },
                                    width: 40,
                                    tooltip: t("io-stats-timeline-snapshot-size-tooltip", "Number of snapshots to keep for timeline charts (10-200)"),
                                },
                                {
                                    id: cid("table-io-stats-hit-timeline-chart-start-refresh-action"),
                                    label: t("auto-refresh", "Auto refresh"),
                                    icon: "AutoRefresh",
                                    run: () => {
                                        if (autoRefreshIntervalId) {
                                            clearInterval(autoRefreshIntervalId);
                                            autoRefreshIntervalId = null;
                                            return;
                                        }
                                        else {
                                            autoRefreshIntervalId = setInterval(() => {
                                                refresh(cid("table-io-stats-grid"));
                                            }, autoRefreshInterval * 1000);
                                        }
                                    }
                                } as Action<any>
                            ],
                        },
                    ],
                }),
                autoSaveId: `table-io-stats-split-${session.profile.sch_id}`,
                secondSize: 50,
            }),
            onDeactivate() {
                if (autoRefreshIntervalId) {
                    clearInterval(autoRefreshIntervalId);
                    autoRefreshIntervalId = null;
                }
            },
        }),
    };
};

export default ioStatsTab;