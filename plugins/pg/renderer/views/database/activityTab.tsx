import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IAutoRefresh, ICopyData, IRenderedSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { Box, Grid2 as Grid, Paper, Stack, Typography, useTheme } from "@mui/material";
import { ChartNumBackends } from "./activityCharts/ChartNumBackends";
import { ChartSessions } from "./activityCharts/ChartSessions";
import { ChartTransactions } from "./activityCharts/ChartTransactions";
import { ChartBlocks } from "./activityCharts/ChartBlocks";
import { ChartTuplesRead } from "./activityCharts/ChartTuplesRead";
import { ChartTuplesWrite } from "./activityCharts/ChartTuplesWrite";
import { ChartConflicts } from "./activityCharts/ChartConflicts";
import { ChartTempFiles } from "./activityCharts/ChartTempFiles";
import { ChartWaitEvents } from "./activityCharts/ChartWaitEvents";
import { ChartCheckpoints } from "./activityCharts/ChartCheckpoints";
import { ChartBgwriterBuffers } from "./activityCharts/ChartBgwriterBuffers";
import { ChartCheckpointTimes } from "./activityCharts/ChartCheckpointTimes";
import { ToolButton } from "@renderer/components/buttons/ToolButton";
import { ProfileRecord } from "src/api/entities";
import TitleChart from "../Components/TitleChart";
import React from "react";
import { versionToNumber } from "../../../../../src/api/version";

export interface ActivityRecord {
    snapshot: number;

    datid: number;
    datname: string;
    numbackends: number;
    backends_idle: number;
    backends_idle_in_transaction: number;
    backends_active: number;
    xact_commit: number;
    xact_rollback: number;
    blks_read: number;
    blks_hit: number;
    tup_returned: number;
    tup_fetched: number;
    tup_inserted: number;
    tup_updated: number;
    tup_deleted: number;
    conflicts?: number;
    temp_files?: number;
    temp_bytes?: number;
    deadlocks?: number;
    wait_lock: number;
    wait_lwlock: number;
    wait_io: number;
    wait_ipc: number;
    wait_timeout: number;
    wait_bufferpin: number;
    wait_client: number;
    // bgwriter
    checkpoints_timed?: number;
    checkpoints_req?: number;
    checkpoint_write_time?: number;
    checkpoint_sync_time?: number;
    buffers_checkpoint?: number;
    buffers_clean?: number;
    maxwritten_clean?: number;
    buffers_backend?: number;
    buffers_backend_fsync?: number;
    buffers_alloc?: number;
    stats_reset?: string;
    timestamp: number;

    [key: string]: any;
}

const activityTab = (
    session: IDatabaseSession,
    databaseName: string | null
): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    let activityRows: ActivityRecord[] = [];
    let snapshotSize = 30 + 1;
    let snapshotCounter = 0;
    let maxConnections = 0; // Dodaj zmienną dla max_connections
    let minimizedCharts: string[] = ["bgwriter-times", "conflicts", "wait-events", "bgwriter-checkpoints"];
    let maximizedCharts: string[] = [];

    const num = (v: any) => {
        const n = typeof v === "number" ? v : Number(v);
        return isFinite(n) ? n : 0;
    };

    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");

    // Lista wykresów do wyświetlenia
    const chartList = [
        { key: "numbackends", title: t("active-connections", "Active Connections"), shortTitle: t("numbackends-short", "Conns"), component: ChartNumBackends, props: { maxConnections } },
        { key: "sessions", title: t("active-sessions", "Active Sessions"), shortTitle: t("sessions-short", "Sess"), component: ChartSessions },
        { key: "transactions", title: t("transactions-commit-rollback", "Transactions (commit/rollback)"), shortTitle: t("transactions-short", "Txns"), component: ChartTransactions },
        { key: "blocks", title: t("blocks-read-hit", "Blocks Read/Hit"), shortTitle: t("blocks-short", "Blocks"), component: ChartBlocks },
        { key: "tuples-read", title: t("tuples-returned-fetched", "Tuples (returned/fetched)"), shortTitle: t("tuples-read-short", "TuplesR"), component: ChartTuplesRead },
        { key: "tuples-write", title: t("tuples-ins-upd-del", "Tuples (inserted/updated/deleted)"), shortTitle: t("tuples-write-short", "TuplesW"), component: ChartTuplesWrite },
        { key: "conflicts", title: t("conflicts-deadlocks", "Conflicts / Deadlocks"), shortTitle: t("conflicts-short", "Conflicts"), component: ChartConflicts },
        { key: "temp-files", title: t("temp-files-bytes", "Temp Files / Bytes"), shortTitle: t("temp-files-short", "TempFiles"), component: ChartTempFiles },
        { key: "wait-events", title: t("wait-events-all-types", "Wait Events (All Types)"), shortTitle: t("wait-events-short", "WEvnts"), component: ChartWaitEvents },
        { key: "bgwriter-checkpoints", title: t("bgwriter-checkpoints", "Checkpoints (timed/req)"), shortTitle: t("bgwriter-checkpoints-short", "ChkPnts"), component: ChartCheckpoints },
        { key: "bgwriter-buffers", title: t("bgwriter-buffers", "BGWriter Buffers"), shortTitle: t("bgwriter-buffers-short", "BGWr Buffs"), component: ChartBgwriterBuffers },
        { key: "bgwriter-times", title: t("bgwriter-times", "Checkpoint Times (ms)"), shortTitle: t("bgwriter-times-short", "ChkPntTms"), component: ChartCheckpointTimes },
    ];

    maximizedCharts = chartList.map(c => c.key).filter(key => !minimizedCharts.includes(key));

    // Persisted state key per session/profile
    const storageKey = `dbActivityCharts:${(session.getUserData("profile") as ProfileRecord).sch_id}`;

    const saveChartState = () => {
        try {
            localStorage.setItem(storageKey, JSON.stringify({ minimizedCharts, maximizedCharts }));
        } catch (_e) { /* ignore */ }
    };

    const loadChartState = () => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) {
                saveChartState();
                return;
            }
            const parsed = JSON.parse(raw);
            if (!parsed || !Array.isArray(parsed.minimizedCharts) || !Array.isArray(parsed.maximizedCharts)) {
                saveChartState();
                return;
            }
            const available = chartList.map(c => c.key).sort();
            const savedCombined = [...new Set([...(parsed.minimizedCharts || []), ...(parsed.maximizedCharts || [])])].sort();
            // If saved keys exactly match available keys, restore; otherwise reset to defaults
            if (available.length === savedCombined.length && available.every((k, i) => k === savedCombined[i])) {
                minimizedCharts = parsed.minimizedCharts.slice();
                maximizedCharts = parsed.maximizedCharts.slice();
            } else {
                minimizedCharts = minimizedCharts.filter(k => chartList.find(c => c.key === k));
                maximizedCharts = chartList.map(c => c.key).filter(key => !minimizedCharts.includes(key));
                saveChartState();
            }
        } catch (_e) {
            // ignore and keep defaults
        }
    };

    // load persisted state immediately after chartList is known
    loadChartState();

    // Pobierz max_connections
    async function fetchMaxConnections() {
        try {
            const { rows } = await session.query<{ setting: string }>(`
                SELECT setting FROM pg_settings WHERE name = 'max_connections'
            `);
            if (rows.length > 0) {
                maxConnections = parseInt(rows[0].setting, 10);
            }
        } catch (error) {
            console.error("Error fetching max_connections:", error);
        }
    }

    // Pobierz dane dla PostgreSQL 17+
    async function fetchActivityDataPG17() {
        if (!databaseName) return;

        const query = `
            WITH db_stats AS (
                SELECT 
                    datid, datname, numbackends,
                    xact_commit, xact_rollback,
                    blks_read, blks_hit,
                    tup_returned, tup_fetched, tup_inserted, tup_updated, tup_deleted,
                    conflicts, temp_files, temp_bytes, deadlocks,
                    blk_read_time, blk_write_time,
                    checksum_failures, checksum_last_failure,
                    session_time, active_time, idle_in_transaction_time,
                    sessions, sessions_abandoned, sessions_fatal, sessions_killed,
                    stats_reset
                FROM pg_stat_database
                WHERE datname = $1
            ),
            backend_stats AS (
                SELECT
                    COUNT(*) FILTER (WHERE state = 'idle') as backends_idle,
                    COUNT(*) FILTER (WHERE state = 'idle in transaction') as backends_idle_in_transaction,
                    COUNT(*) FILTER (WHERE state = 'active') as backends_active,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'Lock') as wait_lock,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'LWLock') as wait_lwlock,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'IO') as wait_io,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'IPC') as wait_ipc,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'Timeout') as wait_timeout,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'BufferPin') as wait_bufferpin,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'Client') as wait_client
                FROM pg_stat_activity
                WHERE datname = $1
            ),
            bgwriter_stats AS (
                SELECT 
                    buffers_alloc
                FROM pg_stat_bgwriter
            ),
            checkpointer_stats AS (
                SELECT
                    num_timed as checkpoints_timed,
                    num_requested as checkpoints_req,
                    write_time as checkpoint_write_time,
                    sync_time as checkpoint_sync_time,
                    buffers_written as buffers_checkpoint
                FROM pg_stat_checkpointer
            )
            SELECT 
                db.*, be.*, bg.*, ck.*,
                EXTRACT(EPOCH FROM now()) * 1000 AS timestamp
            FROM db_stats db
            CROSS JOIN backend_stats be
            CROSS JOIN bgwriter_stats bg
            CROSS JOIN checkpointer_stats ck
        `;

        const { rows } = await session.query<ActivityRecord>(query, [databaseName]);
        return rows;
    }

    // Pobierz dane dla PostgreSQL 14-16
    async function fetchActivityDataPG14() {
        if (!databaseName) return;

        const query = `
            WITH db_stats AS (
                SELECT 
                    datid, datname, numbackends,
                    xact_commit, xact_rollback,
                    blks_read, blks_hit,
                    tup_returned, tup_fetched, tup_inserted, tup_updated, tup_deleted,
                    conflicts, temp_files, temp_bytes, deadlocks,
                    blk_read_time, blk_write_time,
                    checksum_failures, checksum_last_failure,
                    session_time, active_time, idle_in_transaction_time,
                    sessions, sessions_abandoned, sessions_fatal, sessions_killed,
                    stats_reset
                FROM pg_stat_database
                WHERE datname = $1
            ),
            backend_stats AS (
                SELECT
                    COUNT(*) FILTER (WHERE state = 'idle') as backends_idle,
                    COUNT(*) FILTER (WHERE state = 'idle in transaction') as backends_idle_in_transaction,
                    COUNT(*) FILTER (WHERE state = 'active') as backends_active,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'Lock') as wait_lock,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type ilike 'LWLock%') as wait_lwlock,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'IO') as wait_io,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'IPC') as wait_ipc,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'Timeout') as wait_timeout,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'BufferPin') as wait_bufferpin,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'Client') as wait_client
                FROM pg_stat_activity
                WHERE datname = $1
            ),
            bgwriter_stats AS (
                SELECT 
                    checkpoints_timed,
                    checkpoints_req,
                    checkpoint_write_time,
                    checkpoint_sync_time,
                    buffers_checkpoint,
                    buffers_clean,
                    maxwritten_clean,
                    buffers_backend,
                    buffers_backend_fsync,
                    buffers_alloc
                FROM pg_stat_bgwriter
            )
            SELECT 
                db.*, be.*, bg.*,
                EXTRACT(EPOCH FROM now()) * 1000 AS timestamp
            FROM db_stats db
            CROSS JOIN backend_stats be
            CROSS JOIN bgwriter_stats bg
        `;

        const { rows } = await session.query<ActivityRecord>(query, [databaseName]);
        return rows;
    }

    // Pobierz dane dla PostgreSQL 12-13
    async function fetchActivityDataPG12() {
        if (!databaseName) return;

        const query = `
            WITH db_stats AS (
                SELECT 
                    datid, datname, numbackends,
                    xact_commit, xact_rollback,
                    blks_read, blks_hit,
                    tup_returned, tup_fetched, tup_inserted, tup_updated, tup_deleted,
                    conflicts, temp_files, temp_bytes, deadlocks,
                    blk_read_time, blk_write_time,
                    checksum_failures, checksum_last_failure,
                    stats_reset
                FROM pg_stat_database
                WHERE datname = $1
            ),
            backend_stats AS (
                SELECT
                    COUNT(*) FILTER (WHERE state = 'idle') as backends_idle,
                    COUNT(*) FILTER (WHERE state = 'idle in transaction') as backends_idle_in_transaction,
                    COUNT(*) FILTER (WHERE state = 'active') as backends_active,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'Lock') as wait_lock,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type ilike 'LWLock%') as wait_lwlock,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'IO') as wait_io,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'IPC') as wait_ipc,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'Timeout') as wait_timeout,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'BufferPin') as wait_bufferpin,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'Client') as wait_client
                FROM pg_stat_activity
                WHERE datname = $1
            ),
            bgwriter_stats AS (
                SELECT 
                    checkpoints_timed,
                    checkpoints_req,
                    checkpoint_write_time,
                    checkpoint_sync_time,
                    buffers_checkpoint,
                    buffers_clean,
                    maxwritten_clean,
                    buffers_backend,
                    buffers_backend_fsync,
                    buffers_alloc
                FROM pg_stat_bgwriter
            )
            SELECT 
                db.*, be.*, bg.*,
                EXTRACT(EPOCH FROM now()) * 1000 AS timestamp
            FROM db_stats db
            CROSS JOIN backend_stats be
            CROSS JOIN bgwriter_stats bg
        `;

        const { rows } = await session.query<ActivityRecord>(query, [databaseName]);
        return rows;
    }

    // Pobierz dane dla PostgreSQL 9.6-11
    async function fetchActivityDataPG96() {
        if (!databaseName) return;

        const query = `
            WITH db_stats AS (
                SELECT 
                    datid, datname, numbackends,
                    xact_commit, xact_rollback,
                    blks_read, blks_hit,
                    tup_returned, tup_fetched, tup_inserted, tup_updated, tup_deleted,
                    conflicts, temp_files, temp_bytes, deadlocks,
                    blk_read_time, blk_write_time,
                    stats_reset
                FROM pg_stat_database
                WHERE datname = $1
            ),
            backend_stats AS (
                SELECT
                    COUNT(*) FILTER (WHERE state = 'idle') as backends_idle,
                    COUNT(*) FILTER (WHERE state = 'idle in transaction') as backends_idle_in_transaction,
                    COUNT(*) FILTER (WHERE state = 'active') as backends_active,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'Lock') as wait_lock,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type ilike 'LWLock%') as wait_lwlock,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'IO') as wait_io,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'IPC') as wait_ipc,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'Timeout') as wait_timeout,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'BufferPin') as wait_bufferpin,
                    COUNT(*) FILTER (WHERE state != 'idle' AND wait_event_type = 'Client') as wait_client
                FROM pg_stat_activity
                WHERE datname = $1
            ),
            bgwriter_stats AS (
                SELECT 
                    checkpoints_timed,
                    checkpoints_req,
                    checkpoint_write_time,
                    checkpoint_sync_time,
                    buffers_checkpoint,
                    buffers_clean,
                    maxwritten_clean,
                    buffers_backend,
                    buffers_backend_fsync,
                    buffers_alloc
                FROM pg_stat_bgwriter
            )
            SELECT 
                db.*, be.*, bg.*,
                EXTRACT(EPOCH FROM now()) * 1000 AS timestamp
            FROM db_stats db
            CROSS JOIN backend_stats be
            CROSS JOIN bgwriter_stats bg
        `;

        const { rows } = await session.query<ActivityRecord>(query, [databaseName]);
        return rows;
    }

    // Główna funkcja pobierająca dane - wybiera właściwą funkcję na podstawie wersji
    async function fetchActivityData() {
        if (!databaseName) return;

        try {
            let rows: ActivityRecord[] | undefined;

            if (versionNumber >= 170000) {
                rows = await fetchActivityDataPG17();
            } else if (versionNumber >= 140000) {
                rows = await fetchActivityDataPG14();
            } else if (versionNumber >= 120000) {
                rows = await fetchActivityDataPG12();
            } else {
                rows = await fetchActivityDataPG96();
            }

            if (rows && rows.length > 0) {
                const stamped = rows.map(r => ({
                    ...r,
                    snapshot: ++snapshotCounter,
                    timestamp: typeof r.timestamp === 'number' ? r.timestamp : Date.now()
                }));

                activityRows.push(...stamped);

                if (activityRows.length > snapshotSize) {
                    activityRows = activityRows.slice(activityRows.length - snapshotSize);
                }
            }
        } catch (error) {
            console.error("Error fetching activity data:", error);
            throw error;
        }
    }

    // Funkcja do budowy danych do wykresów
    const buildTimelineData = <T extends { snapshot: number }>(rows: T[], mapRow: (r: T, index: number) => any) => {
        const missingSnapshots = Math.max(0, snapshotSize - rows.length);
        const padded: any[] = [];
        for (let i = 0; i < missingSnapshots; i++) {
            padded.push({ snapshot: -1, ...mapRow({} as T, -1) });
        }
        rows.forEach((r, idx) => padded.push(mapRow(r, idx)));
        return padded;
    };

    // Funkcja do przełączania minimalizacji wykresu
    const toggleMinimized = (chartKey: string, refresh: (id: string) => void) => {
        if (minimizedCharts.includes(chartKey)) {
            minimizedCharts = minimizedCharts.filter(k => k !== chartKey);
            maximizedCharts = [...maximizedCharts, chartKey];
        } else {
            minimizedCharts = [...minimizedCharts, chartKey];
            maximizedCharts = maximizedCharts.filter(k => k !== chartKey);
        }
        saveChartState();
        refresh(cid("database-activity-charts"));
    };

    const activityCharts = (): IRenderedSlot => ({
        id: cid("database-activity-charts"),
        type: "rendered",
        render: ({ slotContext }) => {
            const theme = useTheme();

            const data = buildTimelineData(activityRows, (r: ActivityRecord, index: number) => {
                const prev = index > 0 ? activityRows[index - 1] : null;
                return {
                    snapshot: r.snapshot ?? -1,
                    timestamp: r.timestamp ?? Date.now(),
                    numbackends: num(r.numbackends),
                    max_connections: maxConnections,
                    backends_idle: num(r.backends_idle),
                    backends_idle_in_transaction: num(r.backends_idle_in_transaction),
                    backends_active: num(r.backends_active),
                    xact_commit: prev ? Math.max(0, num(r.xact_commit) - num(prev.xact_commit)) : 0,
                    xact_rollback: prev ? Math.max(0, num(r.xact_rollback) - num(prev.xact_rollback)) : 0,
                    blks_read: prev ? Math.max(0, num(r.blks_read) - num(prev.blks_read)) : 0,
                    blks_hit: prev ? Math.max(0, num(r.blks_hit) - num(prev.blks_hit)) : 0,
                    tup_returned: prev ? Math.max(0, num(r.tup_returned) - num(prev.tup_returned)) : 0,
                    tup_fetched: prev ? Math.max(0, num(r.tup_fetched) - num(prev.tup_fetched)) : 0,
                    tup_inserted: prev ? Math.max(0, num(r.tup_inserted) - num(prev.tup_inserted)) : 0,
                    tup_updated: prev ? Math.max(0, num(r.tup_updated) - num(prev.tup_updated)) : 0,
                    tup_deleted: prev ? Math.max(0, num(r.tup_deleted) - num(prev.tup_deleted)) : 0,
                    conflicts: prev ? Math.max(0, num(r.conflicts) - num(prev.conflicts)) : 0,
                    temp_files: prev ? Math.max(0, num(r.temp_files) - num(prev.temp_files)) : 0,
                    temp_bytes: prev ? Math.max(0, num(r.temp_bytes) - num(prev.temp_bytes)) : 0,
                    deadlocks: prev ? Math.max(0, num(r.deadlocks) - num(prev.deadlocks)) : 0,
                    wait_lock: num(r.wait_lock),
                    wait_lwlock: num(r.wait_lwlock),
                    wait_io: num(r.wait_io),
                    wait_ipc: num(r.wait_ipc),
                    wait_timeout: num(r.wait_timeout),
                    wait_bufferpin: num(r.wait_bufferpin),
                    wait_client: num(r.wait_client),
                    checkpoints_timed: prev ? Math.max(0, num(r.checkpoints_timed) - num(prev.checkpoints_timed)) : 0,
                    checkpoints_req: prev ? Math.max(0, num(r.checkpoints_req) - num(prev.checkpoints_req)) : 0,
                    checkpoint_write_time: prev ? Math.max(0, num(r.checkpoint_write_time) - num(prev.checkpoint_write_time)) : 0,
                    checkpoint_sync_time: prev ? Math.max(0, num(r.checkpoint_sync_time) - num(prev.checkpoint_sync_time)) : 0,
                    buffers_checkpoint: prev ? Math.max(0, num(r.buffers_checkpoint) - num(prev.buffers_checkpoint)) : 0,
                    buffers_clean: prev ? Math.max(0, num(r.buffers_clean) - num(prev.buffers_clean)) : 0,
                    maxwritten_clean: prev ? Math.max(0, num(r.maxwritten_clean) - num(prev.maxwritten_clean)) : 0,
                    buffers_backend: prev ? Math.max(0, num(r.buffers_backend) - num(prev.buffers_backend)) : 0,
                    buffers_backend_fsync: prev ? Math.max(0, num(r.buffers_backend_fsync) - num(prev.buffers_backend_fsync)) : 0,
                    buffers_alloc: prev ? Math.max(0, num(r.buffers_alloc) - num(prev.buffers_alloc)) : 0,
                };
            }).slice(-snapshotSize + 1);

            chartList.find(c => c.key === "numbackends")!.props = { maxConnections };

            const maximizedCharstList = React.useMemo(() => maximizedCharts.map(key => chartList.find(c => c.key === key)).filter(Boolean), [maximizedCharts, chartList]);
            const minimizedChartsList = React.useMemo(() => minimizedCharts.map(key => chartList.find(c => c.key === key)).filter(Boolean), [minimizedCharts, chartList]);
            const gridSide = maximizedCharstList.length <= 4 ? 6 : maximizedCharstList.length <= 6 ? 4 : maximizedCharstList.length <= 8 ? 3 : 4;

            return (
                <Stack direction="column" sx={{ width: "100%", height: "100%", overflow: "hidden" }}>
                    <Grid container spacing={8} sx={{ padding: 8, width: "100%", height: "100%", overflow: "hidden" }}>
                        {/* Pozostałe wykresy */}
                        {maximizedCharstList.map(chart => {
                            const ChartComponent = chart!.component;
                            return (
                                <Grid key={chart!.key} size={{ xs: 12, sm: 6, md: gridSide, lg: gridSide, xl: gridSide }}>
                                    <Paper sx={{ width: "100%", height: "100%", padding: 4, }}>
                                        <TitleChart title={chart!.title} variant="body1">
                                            <ToolButton
                                                size="small"
                                                onClick={() => toggleMinimized(chart!.key, slotContext.refresh)}
                                            >
                                                <theme.icons.Pinned color="primary" />
                                            </ToolButton>
                                        </TitleChart>
                                        <ChartComponent minimized={false} data={data} {...(chart!.props || {})} />
                                    </Paper>
                                </Grid>
                            );
                        })}
                    </Grid>

                    {/* Zminimalizowane wykresy po prawej */}
                    {minimizedChartsList.length > 0 && (
                        <Stack direction="row" sx={{ gap: 8, padding: 8, height: "15%" }}>
                            {minimizedChartsList.map(chart => {
                                const ChartComponent = chart!.component;
                                return (
                                    <Paper key={chart!.key} sx={{ width: `${100 / chartList.length}%`, height: "100%", padding: 4, }}>
                                        <TitleChart title={chart!.shortTitle} variant="caption">
                                            <ToolButton
                                                size="small"
                                                onClick={() => toggleMinimized(chart!.key, slotContext.refresh)}
                                                dense
                                            >
                                                <theme.icons.Pin color="error" />
                                            </ToolButton>
                                        </TitleChart>
                                        <ChartComponent minimized={true} data={data} {...(chart!.props || {})} />
                                    </Paper>
                                );
                            })}
                        </Stack>
                    )}
                </Stack>
            );
        }
    });

    return {
        id: cid("database-activity-tab"),
        type: "tab",
        label: {
            id: cid("database-activity-tab-label"),
            type: "tablabel",
            label: t("activity", "Activity"),
            icon: "Statistics",
        },
        content: () => activityCharts(),
        toolBar: {
            id: cid("database-activity-tab-toolbar"),
            type: "toolbar",
            tools: [
                {
                    id: cid("database-activity-snapshot-size-field"),
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
                    onTick: async (slotContext) => {
                        try {
                            await fetchActivityData();
                        } catch (error) {
                            console.error("Error fetching activity data:", error);
                        }
                        slotContext.refresh(cid("database-activity-charts"));
                    },
                    onClear(slotContext) {
                        activityRows = [];
                        snapshotCounter = 0;
                        fetchMaxConnections().then(() => {
                            slotContext.refresh(cid("database-activity-charts"));
                        });
                    },
                    clearOn: "start",
                    canPause: true,
                    lifecycle: {
                        onHide: "ignore",
                        onShow: "ignore",
                    },
                    intervals: [5, 10, 15, 30, 60, 120],
                    defaultInterval: 10,
                } as IAutoRefresh,
            ]
        }
    };
};

export default activityTab;
