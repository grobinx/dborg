import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IAutoRefresh, IRenderedSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Grid2 as Grid, useTheme } from "@mui/material";
import { Action } from "@renderer/components/CommandPalette/ActionManager";
import { exportToClipboard } from "@renderer/utils/arrayTo";

interface ActivityRecord {
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
    snapshot: number;
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

    // Dodaj funkcję formatowania liczb
    const formatNumberShort = (value: number) => {
        if (value == null) return "";
        if (Math.abs(value) >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "G";
        if (Math.abs(value) >= 1_000_000) return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
        if (Math.abs(value) >= 1_000) return (value / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
        return value.toString();
    };

    // Wykresy
    const activityCharts = (): IRenderedSlot => ({
        id: cid("database-activity-charts"),
        type: "rendered",
        render: ({ refresh: _ }) => {
            const theme = useTheme();

            const data = buildTimelineData(activityRows, (r: any, index: number) => {
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
                };
            }).slice(-snapshotSize + 1);

            const CustomTooltip = ({ active, payload }: any) => {
                if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    let timeStr = "-";
                    if (data.snapshot !== -1) {
                        const elapsed = Math.floor((Date.now() - data.timestamp) / 1000);
                        timeStr = t("{{elapsed}}s ago", { elapsed });
                    }
                    return (
                        <div style={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, padding: "8px", borderRadius: "4px", zIndex: 1400 }}>

                            <p style={{ margin: "0 0 4px 0", color: theme.palette.text.primary }}>{timeStr}</p>
                            {payload.map((entry: any, index: number) => (
                                <p key={index} style={{ margin: "2px 0", color: entry.color }}>
                                    {entry.name}: {entry.value}
                                </p>
                            ))}
                        </div>
                    );
                }
                return null;
            };

            return (
                <Grid
                    container
                    spacing={24}
                    sx={{ padding: 8, width: "100%", height: "100%", overflowY: "auto" }}
                >
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4, xl: 4 }}>
                        <h4 style={{ margin: 0, color: theme.palette.text.primary }}>{t("numbackends", "Active Connections")}</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ bottom: 30, top: 5, left: 0, right: 0 }}>
                                <defs>
                                    <linearGradient id="colorNumBackends" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={v => v === -1 ? "-" : String(v)} />
                                <YAxis
                                    stroke={theme.palette.text.secondary}
                                    style={{ fontSize: "0.75rem" }}
                                    domain={[0, maxConnections > 0 ? maxConnections : 'auto']}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: "0.7rem" }} iconSize={10} />
                                <Area
                                    type="monotone"
                                    dataKey="numbackends"
                                    stroke={theme.palette.info.main}
                                    fillOpacity={1}
                                    fill="url(#colorNumBackends)"
                                    name={t("numbackends", "Active Connections")}
                                    isAnimationActive={false}
                                    connectNulls
                                />
                                {maxConnections > 0 && (
                                    <Area
                                        type="monotone"
                                        dataKey="max_connections"
                                        stroke={theme.palette.error.main}
                                        strokeDasharray="5 5"
                                        fill="none"
                                        strokeWidth={2}
                                        name={t("max-connections", "Max Connections")}
                                        isAnimationActive={false}
                                        connectNulls
                                        dot={false}
                                    />
                                )}
                            </AreaChart>
                        </ResponsiveContainer>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4, xl: 4 }}>
                        <h4 style={{ margin: 0, color: theme.palette.text.primary }}>{t("sessions", "Active Sessions")}</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ bottom: 30, top: 5, left: 0, right: 0 }}>
                                <defs>
                                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorIdle" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.main.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.main.main} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorIdleInTransaction" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={v => v === -1 ? "-" : String(v)} />
                                <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: "0.7rem" }} iconSize={10} />
                                <Area type="monotone" dataKey="backends_active" stroke={theme.palette.info.main} fillOpacity={1} fill="url(#colorActive)" name={t("backends-active", "Active")} isAnimationActive={false} connectNulls />
                                <Area type="monotone" dataKey="backends_idle" stroke={theme.palette.main.main} fillOpacity={1} fill="url(#colorIdle)" name={t("backends-idle", "Idle")} isAnimationActive={false} connectNulls />
                                <Area type="monotone" dataKey="backends_idle_in_transaction" stroke={theme.palette.warning.main} fillOpacity={1} fill="url(#colorIdleInTransaction)" name={t("backends-idle-in-transaction", "Idle in Transaction")} isAnimationActive={false} connectNulls />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4, xl: 4 }}>
                        <h4 style={{ margin: 0, color: theme.palette.text.primary }}>{t("transactions", "Transactions (commit/rollback)")}</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ bottom: 30, top: 5, left: 0, right: 0 }}>
                                <defs>
                                    <linearGradient id="colorCommit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorRollback" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={v => v === -1 ? "-" : String(v)} />
                                <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: "0.7rem" }} iconSize={10} />
                                <Area type="monotone" dataKey="xact_commit" stroke={theme.palette.success.main} fillOpacity={1} fill="url(#colorCommit)" name={t("xact-commit", "Commit")} isAnimationActive={false} connectNulls />
                                <Area type="monotone" dataKey="xact_rollback" stroke={theme.palette.error.main} fillOpacity={1} fill="url(#colorRollback)" name={t("xact-rollback", "Rollback")} isAnimationActive={false} connectNulls />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4, xl: 4 }}>
                        <h4 style={{ margin: 0, color: theme.palette.text.primary }}>{t("blocks", "Blocks Read/Hit")}</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ bottom: 30, top: 5, left: 0, right: 0 }}>
                                <defs>
                                    <linearGradient id="colorBlksRead" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorBlksHit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={v => v === -1 ? "-" : String(v)} />
                                <YAxis
                                    stroke={theme.palette.text.secondary}
                                    style={{ fontSize: "0.75rem" }}
                                    tickFormatter={formatNumberShort} // <-- DODAJ TO
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: "0.7rem" }} iconSize={10} />
                                <Area type="monotone" dataKey="blks_read" stroke={theme.palette.warning.main} fillOpacity={1} fill="url(#colorBlksRead)" name={t("blks-read", "Blocks Read")} isAnimationActive={false} connectNulls />
                                <Area type="monotone" dataKey="blks_hit" stroke={theme.palette.success.main} fillOpacity={1} fill="url(#colorBlksHit)" name={t("blks-hit", "Blocks Hit")} isAnimationActive={false} connectNulls />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4, xl: 4 }}>
                        <h4 style={{ margin: 0, color: theme.palette.text.primary }}>{t("tuples-read", "Tuples (returned/fetched)")}</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ bottom: 30, top: 5, left: 0, right: 0 }}>
                                <defs>
                                    <linearGradient id="colorReturned" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorFetched" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={v => v === -1 ? "-" : String(v)} />
                                <YAxis
                                    stroke={theme.palette.text.secondary}
                                    style={{ fontSize: "0.75rem" }}
                                    tickFormatter={formatNumberShort} // <-- DODAJ TO
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: "0.7rem" }} iconSize={10} />
                                <Area type="monotone" dataKey="tup_returned" stroke={theme.palette.info.main} fillOpacity={1} fill="url(#colorReturned)" name={t("tup-returned", "Returned")} isAnimationActive={false} connectNulls />
                                <Area type="monotone" dataKey="tup_fetched" stroke={theme.palette.warning.main} fillOpacity={1} fill="url(#colorFetched)" name={t("tup-fetched", "Fetched")} isAnimationActive={false} connectNulls />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4, xl: 4 }}>
                        <h4 style={{ margin: 0, color: theme.palette.text.primary }}>{t("tuples-write", "Tuples (inserted/updated/deleted)")}</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ bottom: 30, top: 5, left: 0, right: 0 }}>
                                <defs>
                                    <linearGradient id="colorInserted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorUpdated" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorDeleted" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={v => v === -1 ? "-" : String(v)} />
                                <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: "0.7rem" }} iconSize={10} />
                                <Area type="monotone" dataKey="tup_inserted" stroke={theme.palette.success.main} fillOpacity={1} fill="url(#colorInserted)" name={t("tup-inserted", "Inserted")} isAnimationActive={false} connectNulls />
                                <Area type="monotone" dataKey="tup_updated" stroke={theme.palette.secondary.main} fillOpacity={1} fill="url(#colorUpdated)" name={t("tup-updated", "Updated")} isAnimationActive={false} connectNulls />
                                <Area type="monotone" dataKey="tup_deleted" stroke={theme.palette.error.main} fillOpacity={1} fill="url(#colorDeleted)" name={t("tup-deleted", "Deleted")} isAnimationActive={false} connectNulls />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Grid>
                    {/* Trzeci rząd: metryki 9.6+ */}
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4, xl: 4 }}>
                        <h4 style={{ margin: 0, color: theme.palette.text.primary }}>{t("conflicts", "Conflicts / Deadlocks")}</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ bottom: 30, top: 5, left: 0, right: 0 }}>
                                <defs>
                                    <linearGradient id="colorConflicts" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorDeadlocks" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={v => v === -1 ? "-" : String(v)} />
                                <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: "0.7rem" }} iconSize={10} />
                                <Area type="monotone" dataKey="conflicts" stroke={theme.palette.warning.main} fillOpacity={1} fill="url(#colorConflicts)" name={t("conflicts", "Conflicts")} isAnimationActive={false} connectNulls />
                                <Area type="monotone" dataKey="deadlocks" stroke={theme.palette.error.main} fillOpacity={1} fill="url(#colorDeadlocks)" name={t("deadlocks", "Deadlocks")} isAnimationActive={false} connectNulls />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4, xl: 4 }}>
                        <h4 style={{ margin: 0, color: theme.palette.text.primary }}>{t("temp-files", "Temp Files / Bytes")}</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ bottom: 30, top: 5, left: 0, right: 0 }}>
                                <defs>
                                    <linearGradient id="colorTempFiles" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorTempBytes" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={v => v === -1 ? "-" : String(v)} />
                                <YAxis
                                    yAxisId="left"
                                    stroke={theme.palette.info.main}
                                    style={{ fontSize: "0.75rem" }}
                                    tickFormatter={formatNumberShort}
                                    label={{ value: t("temp-files", "Temp Files"), angle: -90, position: "insideLeft", fill: theme.palette.info.main, fontSize: 12 }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    stroke={theme.palette.success.main}
                                    style={{ fontSize: "0.75rem" }}
                                    tickFormatter={formatNumberShort}
                                    label={{ value: t("temp-bytes", "Temp Bytes"), angle: -90, position: "insideRight", fill: theme.palette.success.main, fontSize: 12 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: "0.7rem" }} iconSize={10} />
                                <Area type="monotone" dataKey="temp_files" yAxisId="left" stroke={theme.palette.info.main} fillOpacity={1} fill="url(#colorTempFiles)" name={t("temp-files", "Temp Files")} isAnimationActive={false} connectNulls />
                                <Area type="monotone" dataKey="temp_bytes" yAxisId="right" stroke={theme.palette.success.main} fillOpacity={1} fill="url(#colorTempBytes)" name={t("temp-bytes", "Temp Bytes")} isAnimationActive={false} connectNulls />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4, xl: 4 }}>
                        <h4 style={{ margin: 0, color: theme.palette.text.primary }}>{t("wait-events", "Wait Events (All Types)")}</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ bottom: 30, top: 5, left: 0, right: 0 }}>
                                <defs>
                                    <linearGradient id="colorWaitLock" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorWaitLWLock" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.warning.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.warning.main} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorWaitIO" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.main.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.main.main} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorWaitIPC" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorWaitTimeout" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorWaitBufferPin" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorWaitClient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8} />
                                        <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                                <XAxis dataKey="snapshot" stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} tickFormatter={v => v === -1 ? "-" : String(v)} />
                                <YAxis stroke={theme.palette.text.secondary} style={{ fontSize: "0.75rem" }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: "0.7rem" }} iconSize={10} />
                                <Area type="monotone" dataKey="wait_lock" stroke={theme.palette.error.main} fillOpacity={1} fill="url(#colorWaitLock)" name={t("wait-lock", "Lock")} isAnimationActive={false} connectNulls />
                                <Area type="monotone" dataKey="wait_lwlock" stroke={theme.palette.warning.main} fillOpacity={1} fill="url(#colorWaitLWLock)" name={t("wait-lwlock", "LWLock")} isAnimationActive={false} connectNulls />
                                <Area type="monotone" dataKey="wait_bufferpin" stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#colorWaitBufferPin)" name={t("wait-bufferpin", "BufferPin")} isAnimationActive={false} connectNulls />
                                <Area type="monotone" dataKey="wait_io" stroke={theme.palette.main.main} fillOpacity={1} fill="url(#colorWaitIO)" name={t("wait-io", "IO")} isAnimationActive={false} connectNulls />
                                <Area type="monotone" dataKey="wait_ipc" stroke={theme.palette.info.main} fillOpacity={1} fill="url(#colorWaitIPC)" name={t("wait-ipc", "IPC")} isAnimationActive={false} connectNulls />
                                <Area type="monotone" dataKey="wait_client" stroke={theme.palette.success.main} fillOpacity={1} fill="url(#colorWaitClient)" name={t("wait-client", "Client")} isAnimationActive={false} connectNulls />
                                <Area type="monotone" dataKey="wait_timeout" stroke={theme.palette.secondary.main} fillOpacity={1} fill="url(#colorWaitTimeout)" name={t("wait-timeout", "Timeout")} isAnimationActive={false} connectNulls />
                            </AreaChart>
                        </ResponsiveContainer>
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
                    id: cid("database-activity-copy-activity-snapshots"),
                    label: t("copy-snapshots", "Copy Snapshots"),
                    icon: "Copy",
                    run: () => {
                        exportToClipboard(activityRows, "excel-xml");
                    }
                } as Action<any>
            ]
        }
    };
};

export default activityTab;
