import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { useTheme } from "@mui/material";
import { TableRecord } from ".";

const ioStatsTab = (
    session: IDatabaseSession,
    selectedRow: () => TableRecord | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;
    let ioStatsRows: Record<string, any>[] | null = null;

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
                first: () => ({
                    id: cid("table-io-stats-grid"),
                    type: "grid",
                    mode: "defined",
                    pivot: true,
                    rows: async (refresh) => {
                        if (!selectedRow()) return [];
                        const { rows } = await session.query(
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
                        ioStatsRows = rows;
                        refresh(cid("table-io-stats-chart-slot"));
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
                    autoSaveId: `table-io-stats-grid-${session.profile.sch_id}`,
                } as IGridSlot),
                second: () => ({
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

                        const row = ioStatsRows[0];

                        const hitRatioData = [
                            { name: 'Heap', ratio: row.heap_hit_ratio || 0 },
                            { name: 'Index', ratio: row.idx_hit_ratio || 0 },
                            { name: 'Toast', ratio: row.toast_hit_ratio || 0 },
                            { name: 'Toast Idx', ratio: row.tidx_hit_ratio || 0 },
                        ];

                        const readHitData = [
                            {
                                name: 'Heap',
                                read: row.heap_blks_read || 0,
                                hit: row.heap_blks_hit || 0
                            },
                            {
                                name: 'Index',
                                read: row.idx_blks_read || 0,
                                hit: row.idx_blks_hit || 0
                            },
                            {
                                name: 'Toast',
                                read: row.toast_blks_read || 0,
                                hit: row.toast_blks_hit || 0
                            },
                            {
                                name: 'Toast Idx',
                                read: row.tidx_blks_read || 0,
                                hit: row.tidx_blks_hit || 0
                            },
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
                                                    backgroundColor: theme.palette.background.paper,
                                                    border: `1px solid ${theme.palette.divider}`
                                                }}
                                            />
                                            <Bar dataKey="ratio" name={t("hit-ratio", "Hit Ratio %")}>
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
                                        <BarChart data={readHitData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                            <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
                                            <YAxis stroke={theme.palette.text.secondary} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: theme.palette.background.paper,
                                                    border: `1px solid ${theme.palette.divider}`
                                                }}
                                            />
                                            <Legend />
                                            <Bar dataKey="read" fill={theme.palette.error.main} name={t("read", "Read")} />
                                            <Bar dataKey="hit" fill={theme.palette.success.main} name={t("hit", "Hit")} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        );
                    }
                }),
                autoSaveId: `table-io-stats-split-${session.profile.sch_id}`,
                secondSize: 50,
            }),
        }),
    };
};

export default ioStatsTab;