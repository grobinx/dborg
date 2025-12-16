import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IAutoRefresh, ICopyData, IRenderedSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Grid2 as Grid, Typography, useTheme } from "@mui/material";
import { Action } from "@renderer/components/CommandPalette/ActionManager";
import { exportToClipboard } from "@renderer/utils/arrayTo";
import { CustomTooltip } from "./actiityCharts/CustomTooltip";
import { ChartNumBackends } from "./actiityCharts/ChartNumBackends";
import { ChartSessions } from "./actiityCharts/ChartSessions";
import prettySize from "@renderer/utils/prettySize";
import { ChartTransactions } from "./actiityCharts/ChartTransactions";
import { ChartBlocks } from "./actiityCharts/ChartBlocks";
import { ChartTuplesRead } from "./actiityCharts/ChartTuplesRead";
import { ChartTuplesWrite } from "./actiityCharts/ChartTuplesWrite";
import { ChartConflicts } from "./actiityCharts/ChartConflicts";
import { ChartTempFiles } from "./actiityCharts/ChartTempFiles";
import { ChartWaitEvents } from "./actiityCharts/ChartWaitEvents";
import { ChartCheckpoints } from "./actiityCharts/ChartCheckpoints";
import { ChartBgwriterBuffers } from "./actiityCharts/ChartBgwriterBuffers";
import { ChartCheckpointTimes } from "./actiityCharts/ChartCheckpointTimes";

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
    let snapshotSize = 50 + 1;
    let snapshotCounter = 0;
    let maxConnections = 0; // Dodaj zmienną dla max_connections

    const num = (v: any) => {
        const n = typeof v === "number" ? v : Number(v);
        return isFinite(n) ? n : 0;
    };

    // Wersja serwera
    let version = parseInt((session.getVersion() ?? "0").split(".")[0], 10);

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

    // Pobierz dane z pg_stat_database
    async function fetchDatabaseActivityData() {
        if (!databaseName) {
            return;
        }

        const { rows } = await session.query<ActivityRecord>(`
            SELECT datid, datname, numbackends,
                   xact_commit, xact_rollback, blks_read, blks_hit,
                   tup_returned, tup_fetched, tup_inserted, tup_updated, tup_deleted,
                   conflicts, temp_files, temp_bytes, deadlocks, blk_read_time, blk_write_time,
                   now() AS timestamp
            FROM pg_stat_database
            WHERE datname = $1
        `, [databaseName]);
        if (rows.length > 0) {
            const stamped = rows.map(r => ({
                ...r,
                snapshot: ++snapshotCounter,
                timestamp: Date.now()
            }));
            activityRows.push(...stamped);
            if (activityRows.length > snapshotSize) {
                activityRows = activityRows.slice(activityRows.length - snapshotSize);
            }
        }
    }

    // Pobierz dane z pg_stat_activity o backendach i wait events
    async function fetchBackendActivityData() {
        if (!databaseName) {
            return;
        }

        const { rows } = await session.query<ActivityRecord>(`
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
        `, [databaseName]);

        if (rows.length > 0) {
            activityRows[activityRows.length - 1] = {
                ...activityRows[activityRows.length - 1],
                backends_idle: rows[0].backends_idle || 0,
                backends_idle_in_transaction: rows[0].backends_idle_in_transaction || 0,
                backends_active: rows[0].backends_active || 0,
                wait_lock: rows[0].wait_lock || 0,
                wait_lwlock: rows[0].wait_lwlock || 0,
                wait_io: rows[0].wait_io || 0,
                wait_ipc: rows[0].wait_ipc || 0,
                wait_timeout: rows[0].wait_timeout || 0,
                wait_bufferpin: rows[0].wait_bufferpin || 0,
                wait_client: rows[0].wait_client || 0,
            };
        }
    }

    // Pobierz dane z pg_stat_bgwriter
    async function fetchBgWriterData() {
        if (!databaseName) return;
        if (!activityRows.length) return; // brak snapshotu do uzupełnienia

        const { rows } = await session.query<ActivityRecord>(`
            SELECT checkpoints_timed, checkpoints_req,
                   checkpoint_write_time, checkpoint_sync_time,
                   buffers_checkpoint, buffers_clean, maxwritten_clean,
                   buffers_backend, buffers_backend_fsync, buffers_alloc,
                   stats_reset
            FROM pg_stat_bgwriter
        `);
        if (!rows.length) return;

        activityRows[activityRows.length - 1] = {
            ...activityRows[activityRows.length - 1],
            checkpoints_timed: rows[0].checkpoints_timed ?? 0,
            checkpoints_req: rows[0].checkpoints_req ?? 0,
            checkpoint_write_time: rows[0].checkpoint_write_time ?? 0,
            checkpoint_sync_time: rows[0].checkpoint_sync_time ?? 0,
            buffers_checkpoint: rows[0].buffers_checkpoint ?? 0,
            buffers_clean: rows[0].buffers_clean ?? 0,
            maxwritten_clean: rows[0].maxwritten_clean ?? 0,
            buffers_backend: rows[0].buffers_backend ?? 0,
            buffers_backend_fsync: rows[0].buffers_backend_fsync ?? 0,
            buffers_alloc: rows[0].buffers_alloc ?? 0,
            stats_reset: rows[0].stats_reset,
        };
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

    // Wykresy
    const activityCharts = (): IRenderedSlot => ({
        id: cid("database-activity-charts"),
        type: "rendered",
        render: ({ refresh: _ }) => {
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

            return (
                <Grid
                    container
                    spacing={24}
                    sx={{ padding: 8, width: "100%", height: "100%", overflowY: "auto" }}
                >
                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3, xl: 3 }}>
                        <Typography variant="body1">{t("numbackends", "Active Connections")}</Typography>
                        <ChartNumBackends minimized={false} data={data} maxConnections={maxConnections} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3, xl: 3 }}>
                        <Typography variant="body1">{t("sessions", "Active Sessions")}</Typography>
                        <ChartSessions minimized={false} data={data} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3, xl: 3 }}>
                        <Typography variant="body1">{t("transactions", "Transactions (commit/rollback)")}</Typography>
                        <ChartTransactions minimized={false} data={data} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3, xl: 3 }}>
                        <Typography variant="body1">{t("blocks", "Blocks Read/Hit")}</Typography>
                        <ChartBlocks minimized={false} data={data} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3, xl: 3 }}>
                        <Typography variant="body1">{t("tuples-read", "Tuples (returned/fetched)")}</Typography>
                        <ChartTuplesRead minimized={false} data={data} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3, xl: 3 }}>
                        <Typography variant="body1">{t("tuples-write", "Tuples (inserted/updated/deleted)")}</Typography>
                        <ChartTuplesWrite minimized={false} data={data} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3, xl: 3 }}>
                        <Typography variant="body1">{t("conflicts", "Conflicts / Deadlocks")}</Typography>
                        <ChartConflicts minimized={false} data={data} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3, xl: 3 }}>
                        <Typography variant="body1">{t("temp-files", "Temp Files / Bytes")}</Typography>
                        <ChartTempFiles minimized={false} data={data} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3, xl: 3 }}>
                        <Typography variant="body1">{t("wait-events", "Wait Events (All Types)")}</Typography>
                        <ChartWaitEvents minimized={false} data={data} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3, xl: 3 }}>
                        <Typography variant="body1">{t("bgwriter-checkpoints", "Checkpoints (timed/req)")}</Typography>
                        <ChartCheckpoints minimized={false} data={data} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3, xl: 3 }}>
                        <Typography variant="body1">{t("bgwriter-buffers", "BGWriter Buffers")}</Typography>
                        <ChartBgwriterBuffers minimized={false} data={data} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3, xl: 3 }}>
                        <Typography variant="body1">{t("bgwriter-times", "Checkpoint Times (ms)")}</Typography>
                        <ChartCheckpointTimes minimized={false} data={data} />
                    </Grid>
                </Grid>
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
                    onTick: async (refresh) => {
                        try {
                            await fetchDatabaseActivityData(),
                            await fetchBackendActivityData(),
                            await fetchBgWriterData(),
                            refresh(cid("database-activity-charts"));
                        } catch (error) {
                            console.error("Error fetching activity data:", error);
                        }
                    },
                    onClear(refresh) {
                        activityRows = [];
                        snapshotCounter = 0;
                        // Pobierz max_connections przy pierwszym uruchomieniu
                        fetchMaxConnections().then(() => {
                            refresh(cid("database-activity-charts"));
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
                {
                    getData: () => {
                        return activityRows;
                    }
                } as ICopyData
            ]
        }
    };
};

export default activityTab;
