import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "../../../../manager/renderer/CustomSlots";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { icons } from "@renderer/themes/ThemeWrapper";
import Span from "@renderer/components/useful/Span";
import { tablespaceDdl } from "../../../common/ddls/tablespace";

export interface TablespaceRecord {
    tablespace_name: string;
    owner_name: string;
    location: string | null;
    is_system: boolean;
    options: string | null;
    size: string | null;
    size_bytes: number | null;
    objects_count: number | null;
    databases_count: number | null;
    comment: string | null;
    [key: string]: any;
}

export interface TablespaceStatsRecord {
    size: string;
    size_bytes: number;
    objects_count: number;
    databases_count: number;
    [key: string]: any;
}

export function tablespacesTab(session: IDatabaseSession): ITabSlot {
    const t = i18next.t.bind(i18next);

    let selectedRow: TablespaceRecord | null = null;
    let allRows: TablespaceRecord[] = [];
    const loadingStatsRow: TablespaceRecord[] = [];
    let loadingStats = false;
    let loadingProgress: number | null = null;

    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    async function getTablespaceStats(tablespaceName: string): Promise<TablespaceStatsRecord> {
        const sql = `
with ts as (
    select oid
    from pg_tablespace
    where spcname = $1
)
select
    pg_size_pretty(pg_tablespace_size(ts.oid)) as size,
    pg_tablespace_size(ts.oid)::bigint as size_bytes,
    coalesce((
        select count(*)
        from pg_class c
        where c.reltablespace = ts.oid
          and c.relkind in ('r','p','m','i','S','t')
    ), 0)::int as objects_count,
    coalesce((
        select count(*)
        from pg_database d
        where d.dattablespace = ts.oid
    ), 0)::int as databases_count
from ts;
`;
        const { rows } = await session.query<TablespaceStatsRecord>(sql, [tablespaceName]);
        return rows[0] || {
            size: "0 bytes",
            size_bytes: 0,
            objects_count: 0,
            databases_count: 0,
        };
    }

    const loadingStatsText = (value: any, row: TablespaceRecord) => {
        if (loadingStatsRow.includes(row)) {
            const Icon = icons!.Loading;
            return <Icon />;
        }
        return value;
    };

    const booleanFormatter = (value: any) => {
        return value ? (
            <Span color="warning">{t("yes", "Yes")}</Span>
        ) : (
            <Span color="success">{t("no", "No")}</Span>
        );
    };

    return {
        id: cid("tablespaces-editors-tab"),
        type: "tab",
        closable: false,
        label: {
            id: cid("tablespaces-tab-label"),
            type: "tablabel",
            label: t("database-tablespaces", "Tablespaces"),
            icon: "Tablespace",
        },
        content: {
            id: cid("tablespaces-tab-content"),
            type: "tabcontent",
            content: {
                id: cid("tablespaces-editor-splitter"),
                type: "split",
                direction: "vertical",
                autoSaveId: `tablespaces-editor-splitter-${session.profile.sch_id}`,
                secondSize: 25,
                first: (slotContext) => ({
                    id: cid("tablespaces-grid"),
                    type: "grid",
                    uniqueField: "tablespace_name",
                    rows: async () => {
                        const sql = `
select
    t.spcname as tablespace_name,
    pg_get_userbyid(t.spcowner) as owner_name,
    nullif(pg_tablespace_location(t.oid), '') as location,
    (t.spcname in ('pg_default', 'pg_global')) as is_system,
    case when t.spcoptions is null then null else array_to_string(t.spcoptions, ', ') end as options,
    null::text as size,
    null::bigint as size_bytes,
    null::int as objects_count,
    null::int as databases_count,
    shobj_description(t.oid, 'pg_tablespace') as comment
from pg_tablespace t
order by t.spcname;
`;
                        const { rows } = await session.query<TablespaceRecord>(sql);
                        allRows = rows;
                        return rows;
                    },
                    columns: [
                        { key: "tablespace_name", label: t("tablespace-name", "Tablespace"), dataType: "string", width: 220, sortDirection: "asc", sortOrder: 2 },
                        { key: "owner_name", label: t("owner", "Owner"), dataType: "string", width: 150 },
                        { key: "location", label: t("location", "Location"), dataType: "string", width: 260 },
                        { key: "is_system", label: t("system", "System"), dataType: "boolean", width: 90, formatter: booleanFormatter },
                        { key: "size", label: t("tablespace-size", "Size"), dataType: "size", width: 120, sortDirection: "desc", sortOrder: 1, formatter: loadingStatsText },
                        { key: "objects_count", label: t("objects-count", "Objects"), dataType: "number", width: 100, formatter: loadingStatsText },
                        { key: "databases_count", label: t("databases-count", "Databases"), dataType: "number", width: 110, formatter: loadingStatsText },
                        { key: "options", label: t("options", "Options"), dataType: "string", width: 220 },
                        { key: "comment", label: t("comment", "Comment"), dataType: "string", width: 360 },
                    ] as ColumnDefinition[],
                    onRowSelect: (row: TablespaceRecord | undefined, slotContext) => {
                        if (selectedRow?.tablespace_name !== row?.tablespace_name) {
                            selectedRow = row ?? null;
                            slotContext.refresh(cid("tablespaces-editor"));
                            slotContext.refresh(cid("tablespaces-toolbar"));
                        }
                    },
                    actions: [
                        {
                            id: "tablespace-stats-refresh",
                            label: t("refresh-tablespace-stats", "Refresh Tablespace Stats"),
                            icon: "Reload",
                            keySequence: ["Space"],
                            contextMenuGroupId: "tablespace-stats",
                            contextMenuOrder: 1,
                            disabled: () => selectedRow === null || loadingStats,
                            run: async () => {
                                if (selectedRow) {
                                    const row = selectedRow;
                                    loadingStats = true;
                                    loadingStatsRow.push(row);
                                    slotContext.refresh(cid("tablespaces-grid"), "only");
                                    slotContext.refresh(cid("tablespaces-stats-progress"));
                                    try {
                                        const stats = await getTablespaceStats(row.tablespace_name);
                                        Object.assign(row, stats);
                                    } finally {
                                        const index = loadingStatsRow.indexOf(row);
                                        if (index !== -1) loadingStatsRow.splice(index, 1);
                                        loadingStats = false;
                                        slotContext.refresh(cid("tablespaces-grid"), "compute");
                                        slotContext.refresh(cid("tablespaces-stats-progress"));
                                    }
                                }
                            },
                        },
                        {
                            id: "tablespace-refresh-all",
                            label: () =>
                                loadingStats
                                    ? t("cancel-refresh-tablespaces", "Cancel Refresh All Tablespace Stats")
                                    : t("refresh-tablespaces", "Refresh All Tablespace Stats"),
                            icon: () => (loadingStats ? "ReloadStop" : "ReloadAll"),
                            keySequence: ["Alt+Shift+Enter"],
                            contextMenuGroupId: "tablespace-stats",
                            contextMenuOrder: 2,
                            run: async () => {
                                if (loadingStats) {
                                    loadingStats = false;
                                    return;
                                }
                                loadingStats = true;
                                try {
                                    for (const [index, row] of allRows.entries()) {
                                        loadingProgress = Math.round(((index + 1) / allRows.length) * 100);
                                        loadingStatsRow.push(row);
                                        slotContext.refresh(cid("tablespaces-grid"), "only");
                                        slotContext.refresh(cid("tablespaces-stats-progress"));
                                        try {
                                            const stats = await getTablespaceStats(row.tablespace_name);
                                            Object.assign(row, stats);
                                        } finally {
                                            const i = loadingStatsRow.indexOf(row);
                                            if (i !== -1) loadingStatsRow.splice(i, 1);
                                            slotContext.refresh(cid("tablespaces-grid"), "only");
                                            slotContext.refresh(cid("tablespaces-stats-progress"));
                                        }
                                        if (!loadingStats) break;
                                    }
                                } finally {
                                    loadingStats = false;
                                    loadingProgress = null;
                                    slotContext.refresh(cid("tablespaces-grid"), "compute");
                                    slotContext.refresh(cid("tablespaces-stats-progress"));
                                }
                            },
                        },
                    ],
                    autoSaveId: `tablespaces-grid-${session.profile.sch_id}`,
                    statuses: ["data-rows"],
                    progress: {
                        id: cid("tablespaces-stats-progress"),
                        type: "progress",
                        display: () => loadingStats,
                        value: () => loadingProgress,
                    },
                } as IGridSlot),
                second: {
                    id: cid("tablespaces-editor"),
                    type: "editor",
                    lineNumbers: false,
                    readOnly: true,
                    miniMap: false,
                    content: async () => {
                        if (!selectedRow) return "-- No tablespace selected";
                        return tablespaceDdl(session, selectedRow.tablespace_name);
                    },
                },
            },
        },
        toolBar: {
            id: cid("tablespaces-toolbar"),
            type: "toolbar",
            tools: [["tablespace-stats-refresh", "tablespace-refresh-all"]],
            actionSlotId: cid("tablespaces-grid"),
        },
    };
}