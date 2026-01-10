import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IAutoRefresh, IContentSlot, IGridSlot, IRenderedSlot, ITabSlot, ITabsSlot } from "plugins/manager/renderer/CustomSlots";
import { PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, BarChart, Bar, AreaChart, Area } from 'recharts';
import { useTheme } from "@mui/material";
import { TableRecord } from "./tablesView";
import TitleChart from "../Components/TitleChart";
import Tooltip from "../Components/Tooltip";
import prettySize from "@renderer/utils/prettySize";

interface StorageRecord {
    relkind: string;
    relkind_text: string;
    reloptions: string;
    heap_bytes: number;
    heap: string;
    toast_bytes: number;
    toast: string;
    indexes_bytes: number;
    indexes: string;
    total_bytes: number;
    total: string;
    avg_row_size_bytes: number | null;
    avg_row_size: string | null;
    snapshot: number;
    timestamp: number;
    tablespace: string | null;
    [key: string]: any;
}

interface IndexSizeRecord {
    index_name: string;
    size_bytes: number;
    size: string;
    [key: string]: any;
}

const storageTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null,
    cid: (id: string) => string
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    let storageRows: StorageRecord[] = [];
    let indexSizes: IndexSizeRecord[] = [];
    let lastSelectedTable: TableRecord | null = null;
    let snapshotSize = 20 + 1;
    let snapshotCounter = 0;

    const num = (v: any) => {
        const n = typeof v === 'number' ? v : Number(v);
        return isFinite(n) ? n : 0;
    };

    const pieChart = (): IRenderedSlot => {
        return {
            id: cid("table-storage-pie-chart-slot"),
            type: "rendered",
            render: () => {
                const theme = useTheme();

                if (!storageRows || storageRows.length === 0) {
                    return (
                        <div style={{ padding: 16, color: theme.palette.text.secondary }}>
                            <p>{t("no-data", "No data available")}</p>
                        </div>
                    );
                }

                const row = storageRows[storageRows.length - 1];

                const pieData = [
                    { name: 'Heap', value: num(row.heap_bytes), color: theme.palette.primary.main },
                    { name: 'Toast', value: num(row.toast_bytes), color: theme.palette.warning.main },
                    { name: 'Indexes', value: num(row.indexes_bytes), color: theme.palette.success.main },
                ].filter(d => d.value > 0);

                return (
                    <div style={{
                        padding: 8,
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        boxSizing: 'border-box',
                        overflow: 'hidden'
                    }}>
                        <TitleChart title={t("storage-distribution", "Storage Distribution")} />
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${prettySize(entry.value)}`}
                                    outerRadius="80%"
                                    fill="#8884d8"
                                    dataKey="value"
                                    isAnimationActive={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={prettySize} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                );
            }
        };
    };

    const buildTimelineData = () => {
        const missingSnapshots = Math.max(0, snapshotSize - storageRows.length);
        const padded: any[] = [];

        for (let i = 0; i < missingSnapshots; i++) {
            padded.push({ snapshot: -1, heap: null, toast: null, indexes: null, total: null });
        }

        storageRows.forEach(row => {
            padded.push({
                snapshot: row.snapshot,
                heap: num(row.heap_bytes),
                toast: num(row.toast_bytes),
                indexes: num(row.indexes_bytes),
                total: num(row.total_bytes),
            });
        });

        return padded;
    };

    const timelineChart = (): IRenderedSlot => {
        return {
            id: cid("table-storage-timeline-chart-slot"),
            type: "rendered",
            render: () => {
                const theme = useTheme();

                const timelineData = buildTimelineData();

                return (
                    <div style={{ padding: 8, height: "100%", width: "100%", display: "flex", flexDirection: "column", gap: 8, overflow: "hidden" }}>
                        {/* Top Row */}
                        <div style={{ flex: 1, display: "flex", gap: 8, overflow: "hidden" }}>
                            {/* Heap Chart */}
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                <TitleChart title={t("heap-size-over-time", "Heap")} />
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={timelineData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="colorHeap" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                                                <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                        <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={(v) => v === -1 ? "-" : String(v)} />
                                        <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={(value) => {
                                            if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
                                            if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
                                            if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
                                            return value?.toString?.() ?? "";
                                        }} domain={['dataMin - 5%', 'dataMax + 5%']} />
                                        <Tooltip formatter={prettySize} />
                                        <Area type="monotone" dataKey="heap" stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#colorHeap)" name={t("heap", "Heap")} isAnimationActive={false} connectNulls />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Toast Chart */}
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                <TitleChart title={t("toast-size-over-time", "Toast")} />
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={timelineData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="colorToast" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.8} />
                                                <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                        <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={(v) => v === -1 ? "-" : String(v)} />
                                        <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={(value) => {
                                            if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
                                            if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
                                            if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
                                            return value?.toString?.() ?? "";
                                        }} domain={['dataMin - 5%', 'dataMax + 5%']} />
                                        <Tooltip formatter={prettySize} />
                                        <Area type="monotone" dataKey="toast" stroke={theme.palette.warning.main} fillOpacity={1} fill="url(#colorToast)" name={t("toast", "Toast")} isAnimationActive={false} connectNulls />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bottom Row */}
                        <div style={{ flex: 1, display: "flex", gap: 8, overflow: "hidden" }}>
                            {/* Indexes Chart */}
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                <TitleChart title={t("indexes-size-over-time", "Indexes")} />
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={timelineData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="colorIndexes" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8} />
                                                <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                        <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={(v) => v === -1 ? "-" : String(v)} />
                                        <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={(value) => {
                                            if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
                                            if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
                                            if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
                                            return value?.toString?.() ?? "";
                                        }} domain={['dataMin - 5%', 'dataMax + 5%']} />
                                        <Tooltip formatter={prettySize} />
                                        <Area type="monotone" dataKey="indexes" stroke={theme.palette.success.main} fillOpacity={1} fill="url(#colorIndexes)" name={t("indexes", "Indexes")} isAnimationActive={false} connectNulls />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Total Chart */}
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                                <TitleChart title={t("total-size-over-time", "Total")} />
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={timelineData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.8} />
                                                <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                        <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={(v) => v === -1 ? "-" : String(v)} />
                                        <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={(value) => {
                                            if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
                                            if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
                                            if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
                                            return value?.toString?.() ?? "";
                                        }} domain={['dataMin - 5%', 'dataMax + 5%']} />
                                        <Tooltip formatter={prettySize} />
                                        <Area type="monotone" dataKey="total" stroke={theme.palette.error.main} fillOpacity={1} fill="url(#colorTotal)" name={t("total", "Total")} isAnimationActive={false} connectNulls />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                );
            }
        };
    };

    const indexesChart = (): IRenderedSlot => {
        return {
            id: cid("table-storage-indexes-chart-slot"),
            type: "rendered",
            render: () => {
                const theme = useTheme();

                if (!indexSizes || indexSizes.length === 0) {
                    return (
                        <div style={{ padding: 16, color: theme.palette.text.secondary }}>
                            <p>{t("no-indexes", "No indexes found")}</p>
                        </div>
                    );
                }

                const sortedIndexes = [...indexSizes].sort((a, b) => b.size_bytes - a.size_bytes);

                return (
                    <div style={{
                        padding: 8,
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        boxSizing: 'border-box',
                        overflow: 'hidden'
                    }}>
                        <TitleChart title={t("index-sizes", "Index Sizes")} />
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sortedIndexes} layout="vertical" margin={{ top: 5, right: 30, left: 50, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                <XAxis
                                    type="number"
                                    stroke={theme.palette.text.secondary}
                                    style={{ fontSize: '0.75rem' }}
                                    tickFormatter={(value) => {
                                        if (value >= 1024 * 1024 * 1024) return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
                                        if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
                                        if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
                                        return value.toString();
                                    }}
                                />
                                <YAxis
                                    dataKey="index_name"
                                    type="category"
                                    stroke={theme.palette.text.secondary}
                                    style={{ fontSize: '0.75rem' }}
                                    width={140}
                                />
                                <Tooltip formatter={prettySize} />
                                <Bar
                                    dataKey="size_bytes"
                                    fill={theme.palette.success.main}
                                    name={t("size", "Size")}
                                    isAnimationActive={false}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                );
            }
        };
    };

    const grid = (): IGridSlot => {
        return {
            id: cid("table-storage-grid"),
            type: "grid",
            pivot: true,
            rows: async (slotContext) => {
                if (!selectedRow()) return [];

                if (lastSelectedTable?.schema_name !== selectedRow()!.schema_name ||
                    lastSelectedTable?.table_name !== selectedRow()!.table_name) {
                    storageRows = [];
                    snapshotCounter = 0;
                    lastSelectedTable = selectedRow();
                }

                const { rows } = await session.query<StorageRecord>(
                    `
select
  c.relkind,
  case c.relkind
    when 'r' then 'table'
    when 'p' then 'partitioned table'
    when 'i' then 'index'
    when 'S' then 'sequence'
    when 't' then 'toast'
    when 'm' then 'materialized view'
    when 'v' then 'view'
    when 'f' then 'foreign table'
    else c.relkind::text
  end as relkind_text,
  coalesce(array_to_string(c.reloptions, ', '), '') as reloptions,
  pg_relation_size(c.oid) as heap_bytes,
  pg_size_pretty(pg_relation_size(c.oid)) as heap,
  case when c.reltoastrelid <> 0 then pg_total_relation_size(c.reltoastrelid) else 0 end as toast_bytes,
  case when c.reltoastrelid <> 0 then pg_size_pretty(pg_total_relation_size(c.reltoastrelid)) else '0 bytes' end as toast,
  pg_indexes_size(c.oid) as indexes_bytes,
  pg_size_pretty(pg_indexes_size(c.oid)) as indexes,
  pg_total_relation_size(c.oid) as total_bytes,
  pg_size_pretty(pg_total_relation_size(c.oid)) as total,
  case 
    when s.n_live_tup > 0 then round(pg_relation_size(c.oid)::numeric / s.n_live_tup, 2)
    else null
  end as avg_row_size_bytes,
  case 
    when s.n_live_tup > 0 then pg_size_pretty(round(pg_relation_size(c.oid)::numeric / s.n_live_tup)::bigint)
    else null
  end as avg_row_size,
  -- tablespace: use relation tablespace if set, otherwise database default
  COALESCE(ts.spcname,
    (SELECT spcname FROM pg_tablespace WHERE oid = (SELECT dattablespace FROM pg_database WHERE datname = current_database()))
  ) AS tablespace
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_stat_all_tables s on s.schemaname = n.nspname and s.relname = c.relname
left join pg_tablespace ts on ts.oid = c.reltablespace
where n.nspname = $1 and c.relname = $2;
            `,
                    [selectedRow()!.schema_name, selectedRow()!.table_name]
                );

                // Fetch index sizes
                const indexResult = await session.query<IndexSizeRecord>(
                    `
select
  i.indexrelname as index_name,
  pg_relation_size(i.indexrelid) as size_bytes,
  pg_size_pretty(pg_relation_size(i.indexrelid)) as size
from pg_stat_all_indexes i
where i.schemaname = $1 and i.relname = $2
order by size_bytes desc;
            `,
                    [selectedRow()!.schema_name, selectedRow()!.table_name]
                );
                indexSizes = indexResult.rows;

                if (rows.length > 0) {
                    const stamped = rows.map(r => ({
                        ...r,
                        snapshot: ++snapshotCounter,
                        timestamp: Date.now()
                    }));
                    storageRows.push(...stamped);
                    if (storageRows.length > snapshotSize) {
                        storageRows = storageRows.slice(storageRows.length - snapshotSize);
                    }
                }
                slotContext.refresh(cid("table-storage-pie-chart-slot"));
                slotContext.refresh(cid("table-storage-timeline-chart-slot"));
                slotContext.refresh(cid("table-storage-indexes-chart-slot"));
                return rows;
            },
            columns: [
                { key: "relkind", label: t("relkind", "Kind"), dataType: "string", width: 80 },
                { key: "relkind_text", label: t("relkind-text", "Type"), dataType: "string", width: 180 },
                { key: "tablespace", label: t("tablespace", "Tablespace"), dataType: "string", width: 180 },
                { key: "reloptions", label: t("reloptions", "Options"), dataType: "string", width: 300 },
                { key: "heap_bytes", label: t("heap-bytes", "Heap (bytes)"), dataType: "number", width: 140 },
                { key: "heap", label: t("heap", "Heap"), dataType: "size", width: 120 },
                { key: "toast_bytes", label: t("toast-bytes", "Toast (bytes)"), dataType: "number", width: 140 },
                { key: "toast", label: t("toast", "Toast"), dataType: "size", width: 120 },
                { key: "indexes_bytes", label: t("indexes-bytes", "Indexes (bytes)"), dataType: "number", width: 150 },
                { key: "indexes", label: t("indexes", "Indexes"), dataType: "size", width: 120 },
                { key: "total_bytes", label: t("total-bytes", "Total (bytes)"), dataType: "number", width: 140 },
                { key: "total", label: t("total", "Total"), dataType: "size", width: 120 },
                { key: "avg_row_size_bytes", label: t("avg-row-size-bytes", "Avg Row (bytes)"), dataType: "number", width: 150 },
                { key: "avg_row_size", label: t("avg-row-size", "Avg Row Size"), dataType: "size", width: 130 },
            ] as ColumnDefinition[],
            autoSaveId: `table-storage-grid-${session.profile.sch_id}`,
        };
    };

    return {
        id: cid("table-storage-tab"),
        type: "tab",
        label: () => ({
            id: cid("table-storage-tab-label"),
            type: "tablabel",
            label: t("storage", "Storage"),
        }),
        content: () => ({
            id: cid("table-storage-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("table-storage-split"),
                type: "split",
                direction: "horizontal",
                first: (): IContentSlot => ({
                    id: cid("table-storage-grid-content-slot"),
                    type: "content",
                    title: () => ({
                        id: cid("table-storage-grid-title"),
                        type: "title",
                        title: t("storage-data", "Storage Data"),
                        toolBar: {
                            id: cid("table-storage-grid-toolbar"),
                            type: "toolbar",
                            tools: ([
                                {
                                    id: cid("table-storage-snapshot-size-field"),
                                    type: "number",
                                    defaultValue: snapshotSize - 1,
                                    onChange(value: number | null) {
                                        snapshotSize = (value ?? 10) + 1;
                                    },
                                    width: 50,
                                    min: 10,
                                    max: 200,
                                    step: 10,
                                    tooltip: t("storage-snapshot-size-tooltip", "Number of snapshots to keep for timeline (10-200)"),
                                },
                                {
                                    onTick(slotContext) {
                                        slotContext.refresh(cid("table-storage-grid"));
                                    },
                                    onClear(slotContext) {
                                        storageRows = [];
                                        snapshotCounter = 0;
                                        slotContext.refresh(cid("table-storage-grid"));
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
                    id: cid("table-storage-charts-tabs"),
                    type: "tabs",
                    tabs: [
                        {
                            id: cid("table-storage-pie-chart-tab"),
                            type: "tab",
                            label: () => ({
                                id: cid("table-storage-pie-chart-tab-label"),
                                type: "tablabel",
                                label: t("distribution-chart", "Distribution"),
                            }),
                            content: () => pieChart(),
                        },
                        {
                            id: cid("table-storage-timeline-chart-tab"),
                            type: "tab",
                            label: () => ({
                                id: cid("table-storage-timeline-chart-tab-label"),
                                type: "tablabel",
                                label: t("timeline-chart", "Timeline"),
                            }),
                            content: () => ({
                                id: cid("table-storage-timeline-chart-content"),
                                type: "tabcontent",
                                content: () => timelineChart(),
                            }),
                        },
                        {
                            id: cid("table-storage-indexes-chart-tab"),
                            type: "tab",
                            label: () => ({
                                id: cid("table-storage-indexes-chart-tab-label"),
                                type: "tablabel",
                                label: t("indexes-chart", "Indexes"),
                            }),
                            content: () => ({
                                id: cid("table-storage-indexes-chart-content"),
                                type: "tabcontent",
                                content: () => indexesChart(),
                            }),
                        },
                    ],
                }),
                autoSaveId: `table-storage-split-${session.profile.sch_id}`,
                secondSize: 50,
            }),
        }),
    };
};

export default storageTab;