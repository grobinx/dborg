import React from "react";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IAutoRefresh, IRenderedSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { Box, Paper, Stack, Typography, useTheme, Button, Alert } from "@mui/material";
import { versionToNumber } from "../../../../../src/api/version";

interface FlowSnapshot {
    ts: number;
    numbackends: number;
    blks_read: number;
    blks_hit: number;
    tup_inserted: number;
    tup_updated: number;
    tup_deleted: number;
    xact_commit: number;
    xact_rollback: number;
    temp_files: number;
    temp_bytes: number;
    buffers_checkpoint?: number;
    buffers_backend?: number;
    buffers_alloc?: number;
    wait_lock: number;
    wait_lwlock: number;
    wait_io: number;
    wait_bufferpin: number;
    wait_timeout: number;
    [key: string]: any;
}

interface Anomalies {
    highWaitEvents?: boolean;
    unusualReadWriteRatio?: boolean;
    tempSpike?: boolean;
    rollbackSpike?: boolean;
    lowCacheHitRatio?: boolean;
}

const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

const dataFlowTab = (session: IDatabaseSession, databaseName: string | null): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;
    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");

    let snapshots: FlowSnapshot[] = [];
    const maxSnapshots = 10;
    let snapshotCounter = 0;

    const num = (v: any) => {
        const n = typeof v === "number" ? v : Number(v);
        return isFinite(n) ? n : 0;
    };

    // Wykrywanie anomalii
    const detectAnomalies = (prev: FlowSnapshot, cur: FlowSnapshot): Anomalies => {
        const totalWaits = cur.wait_lock + cur.wait_lwlock + cur.wait_io + cur.wait_bufferpin;
        const readWriteRatio = cur.blks_read / Math.max(1, cur.blks_hit);
        const prevRatio = prev.blks_read / Math.max(1, prev.blks_hit);
        const rollbackRate = cur.xact_rollback / Math.max(1, cur.xact_commit);
        const cacheHitRatio = (cur.blks_hit / (cur.blks_hit + cur.blks_read)) * 100;
        const tempDelta = cur.temp_bytes - prev.temp_bytes;

        return {
            highWaitEvents: totalWaits > 5,
            unusualReadWriteRatio: readWriteRatio > prevRatio * 1.5 && readWriteRatio > 0.1,
            tempSpike: tempDelta > 50_000_000,
            rollbackSpike: rollbackRate > 0.05,
            lowCacheHitRatio: cacheHitRatio < 80 && cur.blks_read > 100,
        };
    };

    // Obliczanie metryk
    const computeMetrics = (prev: FlowSnapshot, cur: FlowSnapshot) => {
        const timeDeltaSec = Math.max(0.1, (cur.ts - prev.ts) / 1000);
        const cacheHitRatio = (cur.blks_hit / (cur.blks_hit + cur.blks_read)) * 100;
        const commitsPerSecond = (cur.xact_commit - prev.xact_commit) / timeDeltaSec;
        const dml = (cur.tup_inserted - prev.tup_inserted) + (cur.tup_updated - prev.tup_updated) + (cur.tup_deleted - prev.tup_deleted);
        const avgTxSize = dml > 0 ? (cur.xact_commit - prev.xact_commit) / dml : 0;

        return { cacheHitRatio, commitsPerSecond, avgTxSize };
    };

    async function fetchSnapshot() {
        if (!databaseName) return;
        const backendWaitCond = versionNumber >= 140000
            ? `COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type ilike 'LWLock%') as wait_lwlock,`
            : `COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type ilike 'LWLock%') as wait_lwlock,`;

        const query = `
            WITH db AS (
                SELECT datname, numbackends,
                       xact_commit, xact_rollback,
                       blks_read, blks_hit,
                       tup_inserted, tup_updated, tup_deleted,
                       temp_files, temp_bytes
                FROM pg_stat_database
                WHERE datname = $1
            ),
            be AS (
                SELECT
                    COUNT(*) FILTER (WHERE state = 'active') as backends_active,
                    ${backendWaitCond}
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'IO') as wait_io,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'BufferPin') as wait_bufferpin,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'Timeout') as wait_timeout
                FROM pg_stat_activity
                WHERE datname = $1
            ),
            bg AS (
                SELECT buffers_alloc, buffers_checkpoint, buffers_backend
                FROM pg_stat_bgwriter
            )
            SELECT db.*, be.*, bg.*, extract(epoch from now())*1000 as ts
            FROM db CROSS JOIN be CROSS JOIN bg
        `;
        const { rows } = await session.query<FlowSnapshot>(query, [databaseName]);
        if (!rows || !rows.length) return;
        const r = rows[0];
        snapshots.push({
            ts: num(r.ts),
            numbackends: num(r.backends_active ?? 0),
            blks_read: num(r.blks_read),
            blks_hit: num(r.blks_hit),
            tup_inserted: num(r.tup_inserted),
            tup_updated: num(r.tup_updated),
            tup_deleted: num(r.tup_deleted),
            xact_commit: num(r.xact_commit),
            xact_rollback: num(r.xact_rollback),
            temp_files: num(r.temp_files),
            temp_bytes: num(r.temp_bytes),
            buffers_checkpoint: num(r.buffers_checkpoint),
            buffers_backend: num(r.buffers_backend),
            buffers_alloc: num(r.buffers_alloc),
            wait_lock: num(r.wait_lock ?? 0),
            wait_lwlock: num(r.wait_lwlock ?? 0),
            wait_io: num(r.wait_io ?? 0),
            wait_bufferpin: num(r.wait_bufferpin ?? 0),
            wait_timeout: num(r.wait_timeout ?? 0),
        });
        snapshotCounter++;
        if (snapshots.length > maxSnapshots) snapshots = snapshots.slice(-maxSnapshots);
    }

    const getNodeColor = (value: number, threshold: number, theme: any, isAlert?: boolean): string => {
        if (isAlert) return theme.palette.error.main;
        if (value === 0) return theme.palette.grey[300];
        if (value < threshold * 0.3) return theme.palette.success.main;
        if (value < threshold * 0.7) return theme.palette.warning.main;
        return theme.palette.error.main;
    };

    const getBarColor = (value: number, maxVal: number, theme: any, isAlert?: boolean): string => {
        if (isAlert) return theme.palette.error.main;
        const ratio = value / Math.max(1, maxVal);
        if (ratio < 0.3) return theme.palette.success.main;
        if (ratio < 0.7) return theme.palette.warning.main;
        return theme.palette.error.main;
    };

    const computeFlow = () => {
        if (snapshots.length < 2) return { nodes: [], links: [], totals: {} as any, anomalies: {} as Anomalies };
        const prev = snapshots[snapshots.length - 2];
        const cur = snapshots[snapshots.length - 1];

        const delta = (k: string) => Math.max(0, (cur as any)[k] - (prev as any)[k]);

        const reads = delta("blks_read");
        const writes = Math.max(0, delta("buffers_checkpoint") + delta("buffers_backend"));
        const tempFiles = delta("temp_files");
        const inserts = delta("tup_inserted");
        const updates = delta("tup_updated");
        const deletes = delta("tup_deleted");
        const dml = inserts + updates + deletes;
        const commits = delta("xact_commit");
        const rollbacks = delta("xact_rollback");
        const backends = cur.numbackends;

        const waits = {
            lock: cur.wait_lock,
            lwlock: cur.wait_lwlock,
            io: cur.wait_io,
            bufferpin: cur.wait_bufferpin,
            timeout: cur.wait_timeout,
        };

        const anomalies = detectAnomalies(prev, cur);
        const metrics = computeMetrics(prev, cur);

        const nodes = [
            { id: "sessions", label: `${t("active-sessions", "Active Sessions")}\n(${backends})`, col: 0, value: backends || 1 },
            { id: "reads", label: `${t("reads", "Reads")}\n(${reads})`, col: 1, value: reads },
            { id: "writes", label: `${t("writes", "Writes (buffers)")}\n(${writes})`, col: 1, value: writes },
            { id: "temp", label: `${t("temp-files", "Temp Files")}\n(${tempFiles})`, col: 2, value: tempFiles },
            { id: "dml", label: `${t("dml", "DML (ins/upd/del)")}\n(${dml})`, col: 2, value: dml },
            { id: "tx", label: `${t("transactions", "Transactions")}\n(C:${commits} R:${rollbacks})`, col: 3, value: commits + rollbacks },
            { id: "bgwriter", label: `${t("bgwriter", "BGWriter")}\n(${delta("buffers_checkpoint")})`, col: 4, value: delta("buffers_checkpoint") },
        ];

        const links = [
            { source: "sessions", target: "reads", value: reads },
            { source: "sessions", target: "writes", value: writes },
            { source: "reads", target: "dml", value: Math.round(reads * 0.1) },
            { source: "writes", target: "bgwriter", value: delta("buffers_checkpoint") },
            { source: "dml", target: "tx", value: dml },
            { source: "temp", target: "bgwriter", value: Math.round(tempFiles) },
            { source: "sessions", target: "temp", value: tempFiles },
        ].filter(l => l.value > 0);

        const totals = { reads, writes, tempFiles, inserts, updates, deletes, dml, commits, rollbacks, waits, ...metrics };

        return { nodes, links, totals, anomalies };
    };

    const renderFlow = (): IRenderedSlot => ({
        id: cid("dataflow-render"),
        type: "rendered",
        render: ({ refresh }) => {
            const theme = useTheme();
            const { nodes, links, totals, anomalies } = computeFlow();

            const maxLink = Math.max(1, ...links.map(l => l.value));
            const colCount = 5;
            const cols = Array.from({ length: colCount }, () => [] as any[]);
            nodes.forEach(n => cols[n.col] && cols[n.col].push(n));

            const hasAnomalies = Object.values(anomalies).some(v => v);

            return (
                <Stack sx={{ width: "100%", height: "100%", padding: 8, gap: 8, overflow: "auto" }}>
                    <Stack direction="row" sx={{ gap: 8 }}>
                        <Paper sx={{ flex: 2, padding: 8 }}>
                            {/* Node visualization */}
                            <Box sx={{ display: "flex", gap: 8, alignItems: "center", height: 160, mb: 8 }}>
                                {cols.map((colNodes, i) => (
                                    <Box key={i} sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                                        {colNodes.map((n: any) => {
                                            const isAlert =
                                                (anomalies.highWaitEvents && ["tx", "sessions"].includes(n.id)) ||
                                                (anomalies.tempSpike && n.id === "temp") ||
                                                (anomalies.rollbackSpike && n.id === "tx");

                                            const nodeColor = getNodeColor(n.value, 1000, theme, isAlert);
                                            return (
                                                <Paper
                                                    key={n.id}
                                                    sx={{
                                                        width: "90%",
                                                        p: 1,
                                                        textAlign: "center",
                                                        bgcolor: nodeColor,
                                                        color: theme.palette.getContrastText(nodeColor),
                                                        transition: "all 0.3s ease",
                                                        boxShadow: isAlert ? `0 0 8px ${theme.palette.error.main}` : "none",
                                                    }}
                                                >
                                                    <Typography variant="caption" sx={{ whiteSpace: "pre-line", fontWeight: isAlert ? "bold" : "normal" }}>
                                                        {n.label}
                                                    </Typography>
                                                </Paper>
                                            );
                                        })}
                                    </Box>
                                ))}
                            </Box>

                            {/* Links as proportional bars */}
                            <Box sx={{ marginTop: 8 }}>
                                <Typography variant="subtitle2" sx={{ mb: 8 }}>{t("data-flows", "Data Flows")}</Typography>
                                {links.map((l, idx) => {
                                    const barColor = getBarColor(l.value, maxLink, theme);
                                    return (
                                        <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 8, mb: 8 }}>
                                            <Typography variant="caption" sx={{ width: 160 }}>{`${l.source} → ${l.target}`}</Typography>
                                            <Box sx={{ height: 12, bgcolor: "divider", flex: 1, position: "relative", borderRadius: 1 }}>
                                                <Box
                                                    sx={{
                                                        position: "absolute",
                                                        left: 0,
                                                        top: 0,
                                                        bottom: 0,
                                                        width: `${(l.value / maxLink) * 100}%`,
                                                        bgcolor: barColor,
                                                        borderRadius: 1,
                                                        transition: "all 0.3s ease",
                                                    }}
                                                />
                                            </Box>
                                            <Typography variant="caption" sx={{ width: 80, textAlign: "right" }}>{l.value}</Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Paper>

                        <Paper sx={{ width: 300, padding: 8 }}>
                            <Typography variant="subtitle2">{t("totals", "Totals (delta)")}</Typography>
                            <Box sx={{ mt: 8 }}>
                                <Typography variant="body2">{t("reads", "Reads")}: {totals.reads ?? 0}</Typography>
                                <Typography variant="body2">{t("writes", "Writes")}: {totals.writes ?? 0}</Typography>
                                <Typography variant="body2">{t("dml", "DML")}: {totals.dml ?? 0} ({totals.inserts ?? 0}/{totals.updates ?? 0}/{totals.deletes ?? 0})</Typography>
                                <Typography variant="body2">
                                    {t("transactions", "Transactions")}: C:{totals.commits ?? 0} R:{totals.rollbacks ?? 0}
                                </Typography>
                                <Typography variant="body2">{t("temp-files", "Temp files")}: {totals.tempFiles ?? 0}</Typography>

                                <Box sx={{ mt: 12, pt: 8, borderTop: `1px solid ${theme.palette.divider}` }}>
                                    <Typography variant="subtitle2">{t("metrics", "Metrics")}</Typography>
                                    <Box sx={{ mt: 8 }}>
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                color: (totals.cacheHitRatio ?? 100) < 80 ? theme.palette.warning.main : theme.palette.success.main
                                            }}
                                        >
                                            Cache Hit: {(totals.cacheHitRatio ?? 100).toFixed(1)}%
                                        </Typography>
                                        <Typography variant="body2">
                                            Commits/sec: {(totals.commitsPerSecond ?? 0).toFixed(2)}
                                        </Typography>
                                        <Typography variant="body2">
                                            Avg TX Size: {(totals.avgTxSize ?? 0).toFixed(1)} rows/tx
                                        </Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ mt: 12, pt: 8, borderTop: `1px solid ${theme.palette.divider}` }}>
                                    <Typography variant="caption">{t("wait-events", "Wait events (current)")}</Typography>
                                    <Typography variant="body2">Lock: {totals.waits?.lock}</Typography>
                                    <Typography variant="body2">LWLock: {totals.waits?.lwlock}</Typography>
                                    <Typography variant="body2">IO: {totals.waits?.io}</Typography>
                                    <Typography variant="body2">BufferPin: {totals.waits?.bufferpin}</Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Stack>

                    {/* Anomaly Alerts */}
                    {hasAnomalies && (
                        <Box sx={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {anomalies.highWaitEvents && (
                                <Alert severity="warning" sx={{ flex: 1, minWidth: 250 }}>
                                    {t("high-wait-events", "High wait events detected")} ({totals.waits.lock + totals.waits.lwlock + totals.waits.io})
                                </Alert>
                            )}
                            {anomalies.lowCacheHitRatio && (
                                <Alert severity="warning" sx={{ flex: 1, minWidth: 250 }}>
                                    {t("low-cache-hit", "Low cache hit ratio")}: {totals.cacheHitRatio?.toFixed(1)}%
                                </Alert>
                            )}
                            {anomalies.tempSpike && (
                                <Alert severity="error" sx={{ flex: 1, minWidth: 250 }}>
                                    {t("temp-spike", "Temp memory spike detected")}: {(totals.tempFiles || 0)} files
                                </Alert>
                            )}
                            {anomalies.rollbackSpike && (
                                <Alert severity="error" sx={{ flex: 1, minWidth: 250 }}>
                                    {t("rollback-spike", "High rollback rate detected")}: {totals.rollbacks}
                                </Alert>
                            )}
                            {anomalies.unusualReadWriteRatio && (
                                <Alert severity="warning" sx={{ flex: 1, minWidth: 250 }}>
                                    {t("unusual-io", "Unusual read/write ratio")}
                                </Alert>
                            )}
                        </Box>
                    )}
                </Stack>
            );
        }
    });

    return {
        id: cid("database-dataflow-tab"),
        type: "tab",
        label: {
            id: cid("dataflow-label"),
            type: "tablabel",
            label: t("data-flow", "Data Flow"),
            icon: "Flow",
        },
        content: () => renderSlotContent(),
        toolBar: {
            id: cid("dataflow-toolbar"),
            type: "toolbar",
            tools: [
                {
                    onTick: async (refresh: (id: string) => void) => {
                        try {
                            await fetchSnapshot();
                        } catch (e) { /* ignore */ }
                        refresh(cid("dataflow-render"));
                    },
                    onClear: (refresh: (id: string) => void) => {
                        snapshots = [];
                        refresh(cid("dataflow-render"));
                    },
                    intervals: [5, 10, 15, 30, 60],
                    defaultInterval: 10,
                    canPause: false,
                    clearOn: "start"
                } as IAutoRefresh
            ],
            actionSlotId: cid("dataflow-render"),
        }
    };

    function renderSlotContent() {
        return {
            id: cid("dataflow-slot"),
            type: "tabcontent",
            content: renderFlow()
        } as unknown as any;
    }
};

export default dataFlowTab;