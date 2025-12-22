import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { RefreshSlotFunction } from "@renderer/containers/ViewSlots/RefreshSlotContext";
import i18next from "i18next";
import { IAutoRefresh, IGridSlot, ITabSlot } from "plugins/manager/renderer/CustomSlots";
import { Action } from "@renderer/components/CommandPalette/ActionManager";
import { alpha, Theme } from "@mui/material";
import { resolveColor } from "@renderer/utils/colors";

interface SessionRecord {
    pid: number;
    usename: string;
    application_name: string;
    client_addr: string;
    client_port: number | null;
    backend_start: string;
    state: string;
    state_change: string;
    state_duration: string | null;
    query: string;
    wait_event_type: string | null;
    wait_event: string | null;
    blocking_pids: number[] | null;
    is_current_session: boolean;
    [key: string]: any;
}

interface LockRecord {
    locktype: string;
    relation: string | null;
    page: number | null;
    tuple: number | null;
    virtualxid: string | null;
    transactionid: number | null;
    classid: number | null;
    objid: number | null;
    objsubid: number | null;
    virtualtransaction: string;
    mode: string;
    granted: boolean;
    fastpath: boolean;
    [key: string]: any;
}

interface TransactionRecord {
    pid: number;
    xact_start: string;
    xact_duration: string | null;
    query_start: string;
    query_duration: string | null;
    backend_xid: number | null;
    backend_xmin: number | null;
    state: string;
    [key: string]: any;
}

const sessionsTab = (session: IDatabaseSession, database: string | null): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const major = parseInt((session.getVersion() ?? "0").split(".")[0], 10);
    const minor = parseInt((session.getVersion() ?? "0").split(".")[1], 0);
    const versionNumber = major * 10000 + minor * 100;
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    let selectedSession: SessionRecord | null = null;
    let hasPgBackendMemoryContexts: boolean = false;
    let hasHeapBlksWritten: boolean | null = null;
    let isSuperuser: boolean = false;

    async function checkSuperuser() {
        try {
            const { rows } = await session.query<{ is_superuser: boolean }>(
                `SELECT current_setting('is_superuser')::boolean AS is_superuser`
            );
            isSuperuser = rows[0]?.is_superuser ?? false;
        } catch {
            isSuperuser = false;
        }
    }

    checkSuperuser();

    async function ensureCapabilities() {
        try {
            const { rows } = await session.query<{ exists: boolean }>(
                `
                    SELECT EXISTS (
                        SELECT 1
                        FROM pg_catalog.pg_proc p
                        JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
                        WHERE n.nspname = 'pg_catalog'
                          AND p.proname = 'pg_backend_memory_contexts'
                          AND p.proargtypes = '23'::oidvector  -- int4
                    ) AS exists
                    `
            );
            hasPgBackendMemoryContexts = rows[0]?.exists ?? false;
        } catch {
            hasPgBackendMemoryContexts = false;
        }
    };

    if (versionNumber >= 130000) {
        ensureCapabilities();
    }

    async function ensureProgressClusterColumns() {
        if (hasHeapBlksWritten !== null) return;
        try {
            const { rows } = await session.query<{ exists: boolean }>(`
                SELECT EXISTS (
                    SELECT 1
                    FROM pg_catalog.pg_attribute a
                    JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
                    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
                    WHERE n.nspname = 'pg_catalog'
                      AND c.relname = 'pg_stat_progress_cluster'
                      AND a.attname = 'heap_blks_written'
                      AND a.attnum > 0
                      AND NOT a.attisdropped
                ) AS exists
            `);
            hasHeapBlksWritten = rows[0]?.exists ?? false;
        } catch {
            hasHeapBlksWritten = false;
        }
    }

    const waitEventFragment = versionNumber >= 90600
        ? `a.wait_event_type, a.wait_event,`
        : `null::text as wait_event_type, null::text as wait_event,`;

    const blockingPidsFragment = versionNumber >= 90600
        ? `
            CASE 
                WHEN nullif(array_length(pg_catalog.pg_blocking_pids(a.pid), 1), 0) IS NULL
                    THEN NULL::int[] 
                ELSE pg_catalog.pg_blocking_pids(a.pid) 
            END AS blocking_pids,
        `
        : `NULL::int[] AS blocking_pids,`;

    return {
        id: cid("sessions-tab"),
        type: "tab",
        label: {
            id: cid("sessions-tab-label"),
            type: "tablabel",
            label: t("sessions", "Sessions"),
            icon: "Sessions",
        },
        content: {
            id: cid("sessions-tab-content"),
            type: "tabcontent",
            content: () => ({
                id: cid("sessions-split"),
                type: "split",
                direction: "vertical",
                first: () => ({
                    id: cid("sessions-content"),
                    type: "content",
                    main: {
                        id: cid("sessions-grid"),
                        type: "grid",
                        mode: "defined",
                        uniqueField: "pid",
                        onRowSelect: (row: SessionRecord | undefined, refresh: RefreshSlotFunction) => {
                            selectedSession = row ?? null;
                            refresh(cid("locks-grid"));
                            refresh(cid("transaction-grid"));
                            if (versionNumber >= 90600) refresh(cid("blocking-tree-tab"));
                            if (versionNumber >= 90600) refresh(cid("progress-vacuum-tab"));
                            if (versionNumber >= 120000) refresh(cid("progress-create-index-tab"));
                            if (versionNumber >= 130000) refresh(cid("progress-cluster-tab"));
                            if (versionNumber >= 130000) refresh(cid("progress-analyze-tab"));
                            if (versionNumber >= 140000) refresh(cid("progress-copy-tab"));
                            if (versionNumber >= 130000) refresh(cid("memory-contexts-tab"));
                        },
                        rows: async () => {
                            selectedSession = null;
                            // Jeśli superuser, pobierz sesje ze wszystkich baz, inaczej tylko z bieżącej
                            const whereClause = isSuperuser
                                ? ''
                                : `WHERE a.datname = $1`;
                            const params = isSuperuser ? [] : [database];

                            const { rows } = await session.query<SessionRecord>(
                                `
                                SELECT 
                                    a.pid,
                                    a.usename,
                                    a.application_name,
                                    a.datname,
                                    coalesce(case when a.client_hostname = '' then null else a.client_hostname end, a.client_addr::text)||':'||a.client_port as client_addr,
                                    a.client_port,
                                    a.backend_start,
                                    a.state,
                                    a.state_change,
                                    case when state in ('active') then to_char(now() - a.query_start, 'dd hh24:mi:ss') end as state_duration,
                                    regexp_replace(a.query, E'^\\\\s+|\\\\s+$', '', 'g') as query,
                                    ${waitEventFragment}
                                    ${blockingPidsFragment}
                                    (a.pid = pg_backend_pid()) as is_current_session
                                FROM pg_catalog.pg_stat_activity a
                                ${whereClause}
                                -- ORDER BY state_duration desc nulls last, state_change desc
                                `,
                                params
                            );
                            return rows;
                        },
                        columns: [
                            { key: "pid", label: t("pid", "PID"), width: 80, dataType: "number" },
                            { key: "usename", label: t("user", "User"), width: 120, dataType: "string" },
                            { key: "application_name", label: t("application", "Application"), width: 150, dataType: "string" },
                            ...(isSuperuser ? [
                                { key: "datname", label: t("database", "Database"), width: 150, dataType: "string" },
                            ] : []),
                            { key: "client_addr", label: t("client-address", "Client Address"), width: 130, dataType: "string" },
                            { key: "backend_start", label: t("backend-start", "Backend Start"), width: 170, dataType: "datetime" },
                            { key: "state", label: t("state", "State"), width: 100, dataType: "string" },
                            { key: "state_change", label: t("state-change", "State Change"), width: 170, dataType: "datetime", sortDirection: "desc", sortOrder: 2 },
                            { key: "state_duration", label: t("state-duration", "Duration"), width: 120, dataType: "string", sortDirection: "desc", sortOrder: 1 },
                            { key: "wait_event_type", label: t("wait-event-type", "Wait Event Type"), width: 140, dataType: "string" },
                            { key: "wait_event", label: t("wait-event", "Wait Event"), width: 140, dataType: "string" },
                            { key: "blocking_pids", label: t("blocking-pids", "Blocking PIDs"), width: 150, dataType: ["number"] },
                            { key: "query", label: t("query", "Query"), width: 400, dataType: "string" },
                        ] as ColumnDefinition[],
                        autoSaveId: `sessions-grid-${session.profile.sch_id}`,
                        status: ["data-rows", "position", "selected-rows"],
                        getRowStyle: (row: { [key: string]: any }, _index, theme: Theme): React.CSSProperties => {
                            const sessionRow = row as SessionRecord;
                            if (sessionRow.is_current_session) {
                                return { backgroundColor: alpha(resolveColor("primary.main", theme), 0.3) };
                            }
                            return {};
                        },
                    } as IGridSlot,
                }),
                second: () => ({
                    id: cid("session-details-tabs"),
                    type: "tabs",
                    tabs: [
                        // Locks tab
                        {
                            id: cid("locks-tab"),
                            type: "tab",
                            label: {
                                id: cid("locks-tab-label"),
                                type: "tablabel",
                                label: t("locks", "Locks"),
                            },
                            content: {
                                id: cid("locks-tab-content"),
                                type: "tabcontent",
                                content: () => ({
                                    id: cid("locks-grid"),
                                    type: "grid",
                                    mode: "defined",
                                    rows: async () => {
                                        if (!selectedSession) return [];
                                        const { rows } = await session.query<LockRecord>(
                                            `
                                            SELECT 
                                                l.locktype,
                                                c.relname as relation,
                                                n.nspname as schema_name,
                                                CASE c.relkind 
                                                    WHEN 'r' THEN 'TABLE'
                                                    WHEN 'p' THEN 'PARTITIONED TABLE'
                                                    WHEN 'i' THEN 'INDEX'
                                                    WHEN 'm' THEN 'MATERIALIZED VIEW'
                                                    WHEN 'S' THEN 'SEQUENCE'
                                                    WHEN 'v' THEN 'VIEW'
                                                    WHEN 'c' THEN 'COMPOSITE TYPE'
                                                    WHEN 't' THEN 'TOAST TABLE'
                                                    WHEN 'f' THEN 'FOREIGN TABLE'
                                                    ELSE c.relkind::text
                                                END as object_type,
                                                pg_catalog.pg_get_userbyid(c.relowner) as owner_name,
                                                tbs.spcname as tablespace_name,
                                                am.amname as access_method,
                                                l.page,
                                                l.tuple,
                                                l.virtualxid,
                                                l.transactionid,
                                                l.classid,
                                                l.objid,
                                                l.objsubid,
                                                l.virtualtransaction,
                                                l.mode,
                                                l.granted,
                                                l.fastpath
                                            FROM pg_catalog.pg_locks l
                                            LEFT JOIN pg_catalog.pg_class c ON c.oid = l.relation
                                            LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
                                            LEFT JOIN pg_catalog.pg_tablespace tbs ON c.reltablespace = tbs.oid
                                            LEFT JOIN pg_catalog.pg_am am ON c.relam = am.oid
                                            WHERE l.pid = $1
                                            ORDER BY l.granted, l.locktype
                                            `,
                                            [selectedSession.pid]
                                        );
                                        return rows;
                                    },
                                    columns: [
                                        { key: "locktype", label: t("lock-type", "Lock Type"), width: 120, dataType: "string" },
                                        { key: "relation", label: t("relation", "Relation"), width: 180, dataType: "string" },
                                        { key: "schema_name", label: t("schema", "Schema"), width: 140, dataType: "string" },
                                        { key: "object_type", label: t("type", "Type"), width: 160, dataType: "string" },
                                        { key: "owner_name", label: t("owner", "Owner"), width: 120, dataType: "string" },
                                        { key: "access_method", label: t("access-method", "Access Method"), width: 130, dataType: "string" },
                                        { key: "tablespace_name", label: t("tablespace", "Tablespace"), width: 140, dataType: "string" },
                                        { key: "mode", label: t("mode", "Mode"), width: 120, dataType: "string" },
                                        { key: "granted", label: t("granted", "Granted"), width: 80, dataType: "boolean" },
                                        { key: "virtualxid", label: t("virtual-xid", "Virtual XID"), width: 120, dataType: "string" },
                                        { key: "transactionid", label: t("transaction-id", "Transaction ID"), width: 120, dataType: "number" },
                                        { key: "fastpath", label: t("fastpath", "Fastpath"), width: 80, dataType: "boolean" },
                                    ] as ColumnDefinition[],
                                    autoSaveId: `locks-grid-${session.profile.sch_id}`,
                                    status: ["data-rows"] as any,
                                }),
                            },
                        },
                        // Transaction Info tab
                        {
                            id: cid("transaction-tab"),
                            type: "tab",
                            label: {
                                id: cid("transaction-tab-label"),
                                type: "tablabel",
                                label: t("transaction", "Transaction"),
                            },
                            content: {
                                id: cid("transaction-tab-content"),
                                type: "tabcontent",
                                content: () => ({
                                    id: cid("transaction-grid"),
                                    type: "grid",
                                    mode: "defined",
                                    rows: async () => {
                                        if (!selectedSession) return [];
                                        const { rows } = await session.query<TransactionRecord>(
                                            `
                                            SELECT 
                                                a.pid,
                                                a.xact_start,
                                                CASE WHEN a.xact_start IS NOT NULL 
                                                     THEN age(clock_timestamp(), a.xact_start)::text 
                                                     ELSE null END as xact_duration,
                                                a.query_start,
                                                CASE WHEN a.query_start IS NOT NULL 
                                                     THEN age(clock_timestamp(), a.query_start)::text 
                                                     ELSE null END as query_duration,
                                                a.backend_xid,
                                                a.backend_xmin,
                                                a.state
                                            FROM pg_catalog.pg_stat_activity a
                                            WHERE a.pid = $1
                                            `,
                                            [selectedSession.pid]
                                        );
                                        return rows;
                                    },
                                    columns: [
                                        { key: "xact_start", label: t("transaction-start", "Transaction Start"), width: 170, dataType: "datetime" },
                                        { key: "xact_duration", label: t("transaction-duration", "Transaction Duration"), width: 150, dataType: "string" },
                                        { key: "query_start", label: t("query-start", "Query Start"), width: 170, dataType: "datetime" },
                                        { key: "query_duration", label: t("query-duration", "Query Duration"), width: 150, dataType: "string" },
                                        { key: "backend_xid", label: t("backend-xid", "Backend XID"), width: 120, dataType: "number" },
                                        { key: "backend_xmin", label: t("backend-xmin", "Backend XMIN"), width: 120, dataType: "number" },
                                        { key: "state", label: t("state", "State"), width: 100, dataType: "string" },
                                    ] as ColumnDefinition[],
                                    autoSaveId: `transaction-grid-${session.profile.sch_id}`,
                                    status: ["data-rows"] as any,
                                }),
                            },
                        },
                        // Blocking Tree (PG 9.6+ via pg_blocking_pids)
                        ...(versionNumber >= 90600 ? [{
                            id: cid("blocking-tree-tab"),
                            type: "tab" as const,
                            label: { id: cid("blocking-tree-tab-label"), type: "tablabel" as const, label: t("blocking-tree", "Blocking Tree") },
                            content: {
                                id: cid("blocking-tree-tab-content"),
                                type: "tabcontent" as const,
                                content: () => ({
                                    id: cid("blocking-tree-grid"),
                                    type: "grid" as const,
                                    mode: "defined" as const,
                                    rows: async () => {
                                        if (!selectedSession) return [];
                                        const { rows } = await session.query<{ blocker_pid: number; blocker_state: string; blocker_query: string }>(
                                            `
                                            SELECT 
                                                bpid AS blocker_pid,
                                                sa.state AS blocker_state,
                                                sa.query AS blocker_query
                                            FROM unnest(pg_blocking_pids($1)) AS bpid
                                            LEFT JOIN pg_stat_activity sa ON sa.pid = bpid
                                            ORDER BY blocker_pid
                                            `,
                                            [selectedSession.pid]
                                        );
                                        return rows;
                                    },
                                    columns: [
                                        { key: "blocker_pid", label: t("pid", "PID"), width: 80, dataType: "number" },
                                        { key: "blocker_state", label: t("state", "State"), width: 120, dataType: "string" },
                                        { key: "blocker_query", label: t("query", "Query"), width: 500, dataType: "string" },
                                    ] as ColumnDefinition[],
                                    autoSaveId: `blocking-tree-grid-${session.profile.sch_id}`,
                                    status: ["data-rows"] as any,
                                }),
                            },
                        }] : []),

                        // Progress VACUUM (PG 9.6+)
                        ...(versionNumber >= 90600 ? [{
                            id: cid("progress-vacuum-tab"),
                            type: "tab" as const,
                            label: { id: cid("progress-vacuum-tab-label"), type: "tablabel" as const, label: t("progress-vacuum", "Progress VACUUM") },
                            content: {
                                id: cid("progress-vacuum-tab-content"),
                                type: "tabcontent" as const,
                                content: () => ({
                                    id: cid("progress-vacuum-grid"),
                                    type: "grid" as const,
                                    mode: "defined" as const,
                                    rows: async () => {
                                        if (!selectedSession) return [];
                                        const { rows } = await session.query<any>(
                                            `
                                            SELECT
                                                p.pid,
                                                n.nspname AS schema_name,
                                                c.relname AS relation,
                                                p.datname,
                                                p.phase,
                                                p.heap_blks_total,
                                                p.heap_blks_scanned,
                                                p.heap_blks_vacuumed,
                                                p.index_vacuum_count,
                                                p.max_dead_tuples,
                                                p.num_dead_tuples
                                            FROM pg_stat_progress_vacuum p
                                            LEFT JOIN pg_class c ON c.oid = p.relid
                                            LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
                                            WHERE p.pid = $1
                                            `,
                                            [selectedSession.pid]
                                        );
                                        return rows;
                                    },
                                    columns: [
                                        { key: "schema_name", label: t("schema", "Schema"), width: 120, dataType: "string" },
                                        { key: "relation", label: t("relation", "Relation"), width: 160, dataType: "string" },
                                        { key: "phase", label: t("phase", "Phase"), width: 180, dataType: "string" },
                                        { key: "heap_blks_total", label: t("heap-total", "Heap Total"), width: 110, dataType: "number" },
                                        { key: "heap_blks_scanned", label: t("heap-scanned", "Heap Scanned"), width: 120, dataType: "number" },
                                        { key: "heap_blks_vacuumed", label: t("heap-vacuumed", "Heap Vacuumed"), width: 130, dataType: "number" },
                                        { key: "index_vacuum_count", label: t("index-vacuum-count", "Index Vacuum Count"), width: 160, dataType: "number" },
                                        { key: "num_dead_tuples", label: t("dead-tuples", "Dead Tuples"), width: 130, dataType: "number" },
                                    ] as ColumnDefinition[],
                                    autoSaveId: `progress-vacuum-grid-${session.profile.sch_id}`,
                                    status: ["data-rows"] as any,
                                }),
                            },
                        }] : []),

                        // Progress CREATE INDEX (PG 12+)
                        ...(versionNumber >= 120000 ? [{
                            id: cid("progress-create-index-tab"),
                            type: "tab" as const,
                            label: { id: cid("progress-create-index-tab-label"), type: "tablabel" as const, label: t("progress-create-index", "Progress CREATE INDEX") },
                            content: {
                                id: cid("progress-create-index-tab-content"),
                                type: "tabcontent" as const,
                                content: () => ({
                                    id: cid("progress-create-index-grid"),
                                    type: "grid" as const,
                                    mode: "defined" as const,
                                    rows: async () => {
                                        if (!selectedSession) return [];
                                        const { rows } = await session.query<any>(
                                            `
                                            SELECT
                                                p.pid,
                                                n.nspname AS schema_name,
                                                c.relname AS table_name,
                                                ic.relname AS index_name,
                                                p.datname,
                                                p.phase,
                                                p.blocks_total,
                                                p.blocks_done,
                                                p.tuples_total,
                                                p.tuples_done,
                                                p.partitions_total,
                                                p.partitions_done
                                            FROM pg_stat_progress_create_index p
                                            LEFT JOIN pg_class c ON c.oid = p.relid
                                            LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
                                            LEFT JOIN pg_class ic ON ic.oid = p.index_relid
                                            WHERE p.pid = $1
                                            `,
                                            [selectedSession.pid]
                                        );
                                        return rows;
                                    },
                                    columns: [
                                        { key: "schema_name", label: t("schema", "Schema"), width: 120, dataType: "string" },
                                        { key: "table_name", label: t("table", "Table"), width: 160, dataType: "string" },
                                        { key: "index_name", label: t("index", "Index"), width: 160, dataType: "string" },
                                        { key: "phase", label: t("phase", "Phase"), width: 180, dataType: "string" },
                                        { key: "blocks_total", label: t("blocks-total", "Blocks Total"), width: 120, dataType: "number" },
                                        { key: "blocks_done", label: t("blocks-done", "Blocks Done"), width: 120, dataType: "number" },
                                        { key: "tuples_total", label: t("tuples-total", "Tuples Total"), width: 130, dataType: "number" },
                                        { key: "tuples_done", label: t("tuples-done", "Tuples Done"), width: 130, dataType: "number" },
                                    ] as ColumnDefinition[],
                                    autoSaveId: `progress-create-index-grid-${session.profile.sch_id}`,
                                    status: ["data-rows"] as any,
                                }),
                            },
                        }] : []),

                        // Progress CLUSTER (PG 13+)
                        ...(versionNumber >= 130000 ? [{
                            id: cid("progress-cluster-tab"),
                            type: "tab" as const,
                            label: { id: cid("progress-cluster-tab-label"), type: "tablabel" as const, label: t("progress-cluster", "Progress CLUSTER") },
                            content: {
                                id: cid("progress-cluster-tab-content"),
                                type: "tabcontent" as const,
                                content: () => ({
                                    id: cid("progress-cluster-grid"),
                                    type: "grid" as const,
                                    mode: "defined" as const,
                                    rows: async () => {
                                        if (!selectedSession) return [];
                                        await ensureProgressClusterColumns();
                                        const heapBlksWrittenSel = hasHeapBlksWritten
                                            ? "p.heap_blks_written"
                                            : "NULL::bigint AS heap_blks_written";
                                        const { rows } = await session.query<any>(`
                                            SELECT
                                                p.pid,
                                                n.nspname AS schema_name,
                                                c.relname AS relation,
                                                p.datname,
                                                p.command,
                                                p.phase,
                                                p.heap_blks_total,
                                                p.heap_blks_scanned,
                                                ${heapBlksWrittenSel},
                                                p.index_rebuild_count
                                            FROM pg_catalog.pg_stat_progress_cluster p
                                            LEFT JOIN pg_catalog.pg_class c ON c.oid = p.relid
                                            LEFT JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
                                            WHERE p.pid = $1
                                        `, [selectedSession.pid]);
                                        return rows;
                                    },
                                    columns: [
                                        { key: "schema_name", label: t("schema", "Schema"), width: 120, dataType: "string" },
                                        { key: "relation", label: t("relation", "Relation"), width: 160, dataType: "string" },
                                        { key: "command", label: t("command", "Command"), width: 120, dataType: "string" },
                                        { key: "phase", label: t("phase", "Phase"), width: 160, dataType: "string" },
                                        { key: "heap_blks_total", label: t("heap-total", "Heap Total"), width: 110, dataType: "number" },
                                        { key: "heap_blks_scanned", label: t("heap-scanned", "Heap Scanned"), width: 120, dataType: "number" },
                                        { key: "heap_blks_written", label: t("heap-written", "Heap Written"), width: 130, dataType: "number" },
                                        { key: "index_rebuild_count", label: t("index-rebuilds", "Index Rebuilds"), width: 140, dataType: "number" },
                                    ] as ColumnDefinition[],
                                    autoSaveId: `progress-cluster-grid-${session.profile.sch_id}`,
                                    status: ["data-rows"] as any,
                                }),
                            },
                        }] : []),

                        // Progress ANALYZE (PG 13+)
                        ...(versionNumber >= 130000 ? [{
                            id: cid("progress-analyze-tab"),
                            type: "tab" as const,
                            label: { id: cid("progress-analyze-tab-label"), type: "tablabel" as const, label: t("progress-analyze", "Progress ANALYZE") },
                            content: {
                                id: cid("progress-analyze-tab-content"),
                                type: "tabcontent" as const,
                                content: () => ({
                                    id: cid("progress-analyze-grid"),
                                    type: "grid" as const,
                                    mode: "defined" as const,
                                    rows: async () => {
                                        if (!selectedSession) return [];
                                        const { rows } = await session.query<any>(
                                            `
                                            SELECT
                                                p.pid,
                                                n.nspname AS schema_name,
                                                c.relname AS relation,
                                                p.datname,
                                                p.sample_blks_total,
                                                p.sample_blks_scanned
                                            FROM pg_stat_progress_analyze p
                                            LEFT JOIN pg_class c ON c.oid = p.relid
                                            LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
                                            WHERE p.pid = $1
                                            `,
                                            [selectedSession.pid]
                                        );
                                        return rows;
                                    },
                                    columns: [
                                        { key: "schema_name", label: t("schema", "Schema"), width: 120, dataType: "string" },
                                        { key: "relation", label: t("relation", "Relation"), width: 160, dataType: "string" },
                                        { key: "sample_blks_total", label: t("sample-total", "Sample Blocks Total"), width: 160, dataType: "number" },
                                        { key: "sample_blks_scanned", label: t("sample-scanned", "Sample Blocks Scanned"), width: 160, dataType: "number" },
                                    ] as ColumnDefinition[],
                                    autoSaveId: `progress-analyze-grid-${session.profile.sch_id}`,
                                    status: ["data-rows"] as any,
                                }),
                            },
                        }] : []),

                        // Progress COPY (PG 14+)
                        ...(versionNumber >= 140000 ? [{
                            id: cid("progress-copy-tab"),
                            type: "tab" as const,
                            label: { id: cid("progress-copy-tab-label"), type: "tablabel" as const, label: t("progress-copy", "Progress COPY") },
                            content: {
                                id: cid("progress-copy-tab-content"),
                                type: "tabcontent" as const,
                                content: () => ({
                                    id: cid("progress-copy-grid"),
                                    type: "grid" as const,
                                    mode: "defined" as const,
                                    rows: async () => {
                                        if (!selectedSession) return [];
                                        const { rows } = await session.query<any>(
                                            `
                                            SELECT
                                                p.pid,
                                                p.datname,
                                                p.relid::regclass::text AS relation,
                                                p.command,
                                                p.bytes_processed,
                                                pg_size_pretty(p.bytes_processed) AS bytes_processed_pretty
                                            FROM pg_stat_progress_copy p
                                            WHERE p.pid = $1
                                            `,
                                            [selectedSession.pid]
                                        );
                                        return rows;
                                    },
                                    columns: [
                                        { key: "relation", label: t("relation", "Relation"), width: 180, dataType: "string" },
                                        { key: "command", label: t("command", "Command"), width: 120, dataType: "string" },
                                        { key: "bytes_processed_pretty", label: t("bytes", "Bytes"), width: 120, dataType: "string" },
                                    ] as ColumnDefinition[],
                                    autoSaveId: `progress-copy-grid-${session.profile.sch_id}`,
                                    status: ["data-rows"] as any,
                                }),
                            },
                        }] : []),

                        // Backend Memory Contexts (PG 13+)
                        ...(hasPgBackendMemoryContexts ? [{
                            id: cid("memory-contexts-tab"),
                            type: "tab" as const,
                            label: { id: cid("memory-contexts-tab-label"), type: "tablabel" as const, label: t("memory-contexts", "Memory Contexts") },
                            content: {
                                id: cid("memory-contexts-tab-content"),
                                type: "tabcontent" as const,
                                content: () => ({
                                    id: cid("memory-contexts-grid"),
                                    type: "grid" as const,
                                    mode: "defined" as const,
                                    rows: async () => {
                                        if (!selectedSession) return [];
                                        const { rows } = await session.query<any>(
                                            `
                                            SELECT 
                                                name,
                                                ident,
                                                parent,
                                                level,
                                                total_bytes,
                                                total_bytes::text AS total_bytes_raw,
                                                pg_size_pretty(total_bytes) AS total_bytes_pretty
                                            FROM pg_backend_memory_contexts($1::int)
                                            ORDER BY level, total_bytes DESC
                                            `,
                                            [selectedSession.pid]
                                        );
                                        return rows;
                                    },
                                    columns: [
                                        { key: "level", label: t("level", "Level"), width: 70, dataType: "number" },
                                        { key: "name", label: t("name", "Name"), width: 200, dataType: "string" },
                                        { key: "ident", label: t("ident", "Ident"), width: 200, dataType: "string" },
                                        { key: "parent", label: t("parent", "Parent"), width: 200, dataType: "string" },
                                        { key: "total_bytes_pretty", label: t("bytes", "Bytes"), width: 120, dataType: "string" },
                                    ] as ColumnDefinition[],
                                    autoSaveId: `memory-contexts-grid-${session.profile.sch_id}`,
                                    status: ["data-rows"] as any,
                                }),
                            },
                        }] : []),
                    ],
                }),
                autoSaveId: `sessions-split-${session.profile.sch_id}`,
            }),
        },
        toolBar: () => ({
            id: cid("sessions-tab-toolbar"),
            type: "toolbar",
            tools: [
                {
                    onTick: async (refresh) => {
                        refresh(cid("sessions-grid"));
                        if (selectedSession) {
                            refresh(cid("locks-grid"));
                            refresh(cid("transaction-grid"));
                            if (versionNumber >= 90600) refresh(cid("blocking-tree-tab"));
                            if (versionNumber >= 90600) refresh(cid("progress-vacuum-tab"));
                            if (versionNumber >= 120000) refresh(cid("progress-create-index-tab"));
                            if (versionNumber >= 130000) refresh(cid("progress-cluster-tab"));
                            if (versionNumber >= 130000) refresh(cid("progress-analyze-tab"));
                            if (versionNumber >= 140000) refresh(cid("progress-copy-tab"));
                            if (versionNumber >= 130000 && hasPgBackendMemoryContexts) refresh(cid("memory-contexts-tab"));
                        }
                    },
                    canPause: false,
                    intervals: [2, 5, 10, 15, 30, 60],
                    defaultInterval: 5,
                    canRefresh: true,
                } as IAutoRefresh,
            ],
            actionSlotId: cid("sessions-grid"),
        }),
    };
};

export default sessionsTab;