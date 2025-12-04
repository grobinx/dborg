import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IAutoRefresh, IContentSlot, IGridSlot, IRenderedSlot, ITabSlot, ITabsSlot } from "plugins/manager/renderer/CustomSlots";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { useTheme } from "@mui/material";
import { TableRecord } from ".";

interface StatRecord {
    n_live_tup: number;
    n_dead_tup: number;
    n_mod_since_analyze: number;
    seq_scan: number;
    seq_tup_read: number;
    idx_scan: number;
    idx_tup_fetch: number;
    n_tup_ins: number;
    n_tup_upd: number;
    n_tup_del: number;
    n_tup_hot_upd: number;
    last_vacuum: string | null;
    last_autovacuum: string | null;
    last_analyze: string | null;
    last_autoanalyze: string | null;
    vacuum_count: number;
    autovacuum_count: number;
    analyze_count: number;
    autoanalyze_count: number;
    snapshot: number;
    timestamp: number;
    [key: string]: any;
}

const statisticsTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    let statRows: StatRecord[] = [];
    let lastSelectedTable: TableRecord | null = null;
    let snapshotSize = 20 + 1;
    let snapshotCounter = 0;

    const num = (v: any) => {
        const n = typeof v === "number" ? v : Number(v);
        return isFinite(n) ? n : 0;
    };

    const buildTimelineData = <T extends { snapshot: number }>(rows: T[], mapRow: (r: T) => any) => {
        const missingSnapshots = Math.max(0, snapshotSize - rows.length);
        const padded: any[] = [];
        for (let i = 0; i < missingSnapshots; i++) {
            padded.push({ snapshot: -1, ...mapRow({} as T) }); // null/0 wartości zależnie od mapRow
        }
        rows.forEach(r => padded.push(mapRow(r)));
        return padded;
    };

    // Timeline: DML (insert/update/delete/hot_update) – pokazujemy narastające wartości w czasie (proste linie)
    const dmlTimelineChart = (): IRenderedSlot => ({
        id: cid("table-statistics-dml-timeline-chart"),
        type: "rendered",
        render: () => {
            const theme = useTheme();

            if (!statRows || statRows.length < 2) {
                return <div style={{ padding: 16, color: theme.palette.text.secondary }}>{t("no-data-timeline", "Not enough data for timeline (need at least 2 snapshots)")}</div>;
            }

            // DML timeline
            const data = buildTimelineData(statRows, (r: any) => ({
                snapshot: r.snapshot ?? -1,
                ins: r.n_tup_ins != null ? num(r.n_tup_ins) : null,
                upd: r.n_tup_upd != null ? num(r.n_tup_upd) : null,
                del: r.n_tup_del != null ? num(r.n_tup_del) : null,
                hot: r.n_tup_hot_upd != null ? num(r.n_tup_hot_upd) : null,
            }));

            return (
                <div style={{ padding: 8, height: "100%", width: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <h4 style={{ margin: 0, color: theme.palette.text.primary }}>{t("dml-timeline", "DML Timeline")}</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                            <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={(v) => v === -1 ? "-" : String(v)} />
                            <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} />
                            <Tooltip contentStyle={{ backgroundColor: theme.palette.background.tooltip, border: `1px solid ${theme.palette.divider}` }} />
                            <Legend />
                            <Line type="monotone" dataKey="ins" stroke={theme.palette.success.main} name={t("insert", "Insert")} dot={false} isAnimationActive={false} connectNulls />
                            <Line type="monotone" dataKey="upd" stroke={theme.palette.warning.main} name={t("update", "Update")} dot={false} isAnimationActive={false} connectNulls />
                            <Line type="monotone" dataKey="del" stroke={theme.palette.error.main} name={t("delete", "Delete")} dot={false} isAnimationActive={false} connectNulls />
                            <Line type="monotone" dataKey="hot" stroke={theme.palette.info.main} name={t("hot-update", "HOT Update")} dot={false} isAnimationActive={false} connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            );
        }
    });

    // Scans: seq_scan vs idx_scan – wykres słupkowy
    const scansChart = (): IRenderedSlot => ({
        id: cid("table-statistics-scans-chart"),
        type: "rendered",
        render: () => {
            const theme = useTheme();

            if (!statRows || statRows.length === 0) {
                return <div style={{ padding: 16, color: theme.palette.text.secondary }}>{t("no-data", "No data available")}</div>;
            }

            const last = statRows[statRows.length - 1];
            const data = [{ name: selectedRow()?.table_name ?? "table", seq_scan: num(last.seq_scan), idx_scan: num(last.idx_scan) }];

            return (
                <div style={{ padding: 8, height: "100%", width: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <h4 style={{ margin: 0, color: theme.palette.text.primary }}>{t("scan-usage", "Scan Usage")}</h4>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
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
                            <Tooltip contentStyle={{ backgroundColor: theme.palette.background.tooltip, border: `1px solid ${theme.palette.divider}` }} />
                            <Legend />
                            <Bar dataKey="seq_scan" fill={theme.palette.error.main} name={t("seq-scan", "Seq Scan")} isAnimationActive={false} />
                            <Bar dataKey="idx_scan" fill={theme.palette.success.main} name={t("idx-scan", "Idx Scan")} isAnimationActive={false} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            );
        }
    });

    // Live vs Dead tuples – linie
    const liveDeadTimelineChart = (): IRenderedSlot => ({
        id: cid("table-statistics-live-dead-timeline-chart"),
        type: "rendered",
        render: () => {
            const theme = useTheme();

            if (!statRows || statRows.length < 2) {
                return <div style={{ padding: 16, color: theme.palette.text.secondary }}>{t("no-data-timeline", "Not enough data for timeline (need at least 2 snapshots)")}</div>;
            }

            const data = buildTimelineData(statRows, (r: any) => ({
                snapshot: r.snapshot ?? -1,
                live: r.n_live_tup != null ? num(r.n_live_tup) : null,
                dead: r.n_dead_tup != null ? num(r.n_dead_tup) : null,
            }));

            // Data for pie chart (latest snapshot)
            const lastRow = statRows[statRows.length - 1];
            const liveCount = num(lastRow?.n_live_tup);
            const deadCount = num(lastRow?.n_dead_tup);
            const pieData = [
                { name: t("live", "Live"), value: liveCount },
                { name: t("dead", "Dead"), value: deadCount }
            ];

            const COLORS = [theme.palette.success.main, theme.palette.error.main];

            return (
                <div style={{ padding: 8, height: "100%", width: "100%", display: "flex", gap: 8, overflow: "hidden" }}>
                    {/* Timeline Charts */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
                        {/* Live Tuples Chart */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                            <h4 style={{ margin: 0, color: theme.palette.text.primary }}>{t("live-tuples", "Live Tuples")}</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorLive" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                    <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={(v) => v === -1 ? "-" : String(v)} />
                                    <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} domain={['dataMin - 5%', 'dataMax + 5%']} />
                                    <Tooltip contentStyle={{ backgroundColor: theme.palette.background.tooltip, border: `1px solid ${theme.palette.divider}` }} />
                                    <Legend />
                                    <Area type="monotone" dataKey="live" stroke={theme.palette.success.main} fillOpacity={1} fill="url(#colorLive)" name={t("live", "Live")} isAnimationActive={false} connectNulls />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Dead Tuples Chart */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                            <h4 style={{ margin: 0, color: theme.palette.text.primary }}>{t("dead-tuples", "Dead Tuples")}</h4>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorDead" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                    <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={(v) => v === -1 ? "-" : String(v)} />
                                    <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} domain={['dataMin - 5%', 'dataMax + 5%']} />
                                    <Tooltip contentStyle={{ backgroundColor: theme.palette.background.tooltip, border: `1px solid ${theme.palette.divider}` }} />
                                    <Legend />
                                    <Area type="monotone" dataKey="dead" stroke={theme.palette.error.main} fillOpacity={1} fill="url(#colorDead)" name={t("dead", "Dead")} isAnimationActive={false} connectNulls />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pie Chart */}
                    <div style={{ flex: 0.6, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        <h4 style={{ margin: 0, color: theme.palette.text.primary }}>{t("live-dead-ratio", "Live/Dead Ratio")}</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                                    outerRadius={80}
                                    fill={theme.palette.background.paper}
                                    dataKey="value"
                                    isAnimationActive={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: theme.palette.background.tooltip, border: `1px solid ${theme.palette.divider}` }} formatter={(value: number) => value.toLocaleString()} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            );
        }
    });

    const grid = (): IGridSlot => ({
        id: cid("table-statistics-grid"),
        type: "grid",
        mode: "defined",
        pivot: true,
        rows: async (refresh) => {
            if (!selectedRow()) return [];

            if (lastSelectedTable?.schema_name !== selectedRow()!.schema_name ||
                lastSelectedTable?.table_name !== selectedRow()!.table_name) {
                statRows = [];
                snapshotCounter = 0;
                lastSelectedTable = selectedRow();
            }

            const { rows } = await session.query<StatRecord>(`
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
      `, [selectedRow()!.schema_name, selectedRow()!.table_name]);

            if (rows.length > 0) {
                const stamped = rows.map(r => ({
                    ...r,
                    snapshot: ++snapshotCounter,
                    timestamp: Date.now()
                }));
                statRows.push(...stamped);
                if (statRows.length > snapshotSize) {
                    statRows = statRows.slice(statRows.length - snapshotSize);
                }
            }

            refresh(cid("table-statistics-dml-timeline-chart"));
            refresh(cid("table-statistics-scans-chart"));
            refresh(cid("table-statistics-live-dead-timeline-chart"));
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
    });

    return {
        id: cid("table-statistics-tab"),
        type: "tab",
        label: () => ({
            id: cid("table-statistics-tab-label"),
            type: "tablabel",
            label: t("statistics", "Statistics"),
        }),
        content: () => ({
            id: cid("table-statistics-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-statistics-split"),
                type: "split",
                direction: "horizontal",
                first: (): IContentSlot => ({
                    id: cid("table-statistics-grid-content-slot"),
                    type: "content",
                    title: () => ({
                        id: cid("table-statistics-grid-title"),
                        type: "title",
                        title: t("statistics-data", "Statistics Data"),
                        toolBar: {
                            id: cid("table-statistics-grid-toolbar"),
                            type: "toolbar",
                            tools: ([
                                {
                                    id: cid("table-statistics-snapshot-size-field"),
                                    type: "number",
                                    defaultValue: snapshotSize - 1,
                                    onChange(value: number | null) {
                                        snapshotSize = (value ?? 10) + 1;
                                    },
                                    width: 50,
                                    min: 10,
                                    max: 200,
                                    step: 10,
                                    tooltip: t("statistics-snapshot-size-tooltip", "Number of snapshots to keep for timeline (10-200)"),
                                },
                                {
                                    onTick(refresh) {
                                        refresh(cid("table-statistics-grid"));
                                    },
                                    onClear(refresh) {
                                        statRows = [];
                                        snapshotCounter = 0;
                                        refresh(cid("table-statistics-grid"));
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
                    id: cid("table-statistics-charts-tabs"),
                    type: "tabs",
                    tabs: [
                        {
                            id: cid("table-statistics-dml-timeline-tab"),
                            type: "tab",
                            label: () => ({
                                id: cid("table-statistics-dml-timeline-tab-label"),
                                type: "tablabel",
                                label: t("dml-timeline", "DML Timeline"),
                            }),
                            content: () => dmlTimelineChart(),
                        },
                        {
                            id: cid("table-statistics-scans-tab"),
                            type: "tab",
                            label: () => ({
                                id: cid("table-statistics-scans-tab-label"),
                                type: "tablabel",
                                label: t("scan-usage", "Scan Usage"),
                            }),
                            content: () => ({
                                id: cid("table-statistics-scans-content"),
                                type: "tabcontent",
                                content: () => scansChart(),
                            }),
                        },
                        {
                            id: cid("table-statistics-live-dead-tab"),
                            type: "tab",
                            label: () => ({
                                id: cid("table-statistics-live-dead-tab-label"),
                                type: "tablabel",
                                label: t("live-dead", "Live vs Dead"),
                            }),
                            content: () => ({
                                id: cid("table-statistics-live-dead-content"),
                                type: "tabcontent",
                                content: () => liveDeadTimelineChart(),
                            }),
                        },
                    ],
                }),
                autoSaveId: `table-statistics-split-${session.profile.sch_id}`,
                secondSize: 50,
            }),
        }),
    };
};

export default statisticsTab;