import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "../../../../manager/renderer/CustomSlots";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { RefreshSlotFunction } from "@renderer/containers/ViewSlots/RefreshSlotContext";
import { icons } from "@renderer/themes/ThemeWrapper";
import { resolveColor } from "@renderer/utils/colors";
import { useTheme } from "@mui/material";
import { versionToNumber } from "../../../../../src/api/version";
import { roleConfigDdl, roleCreateDdl, roleGrantsDdl, roleMembershipDdl } from "../../../common/ddls/role";
import Span from "@renderer/components/useful/Span";

export interface RoleRecord {
    role_name: string;
    rolsuper: boolean;
    rolcreaterole: boolean;
    rolcreatedb: boolean;
    rolcanlogin: boolean;
    rolinherit: boolean;
    rolreplication: boolean;
    rolbypassrls: boolean;
    role_size: string | null;
    role_size_bytes: number | null;
    tables_count: number | null;
    views_count: number | null;
    functions_count: number | null;
    sequences_count: number | null;
    types_count: number | null;
    total_objects: number | null;
    comment: string | null;
    [key: string]: any;
}

export interface RoleStatsRecord {
    tables_count: number;
    views_count: number;
    functions_count: number;
    sequences_count: number;
    types_count: number;
    total_objects: number;
    role_size: string;
    role_size_bytes: number;
    [key: string]: any;
}

export function rolesTab(session: IDatabaseSession): ITabSlot {
    const t = i18next.t.bind(i18next);

    let selectedRow: RoleRecord | null = null;
    let allRows: RoleRecord[] = [];
    const loadingStatsRow: RoleRecord[] = [];
    let loadingStats = false;
    let loadingProgress: number | null = null;
    const versionNumber = versionToNumber(session.getVersion() || "0.0.0");

    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    async function getRoleStats(roleName: string): Promise<RoleStatsRecord> {
        const sql = `
with r as (select oid from pg_roles where rolname = $1)
select
    coalesce(oc.tables_count, 0)::int as tables_count,
    coalesce(oc.views_count, 0)::int as views_count,
    coalesce(fc.functions_count, 0)::int as functions_count,
    coalesce(oc.sequences_count, 0)::int as sequences_count,
    coalesce(tc.types_count, 0)::int as types_count,
    coalesce(oc.tables_count, 0) + coalesce(oc.views_count, 0) +
    coalesce(fc.functions_count, 0) + coalesce(oc.sequences_count, 0) +
    coalesce(tc.types_count, 0) as total_objects,
    pg_size_pretty(sum(pg_total_relation_size(c.oid))) as role_size,
    sum(pg_total_relation_size(c.oid))::bigint as role_size_bytes
from r
left join pg_class c
    on c.relowner = r.oid
    and c.relkind in ('r','m','S') -- storage-bearing objects; indexes/toast included in pg_total_relation_size
left join (
    select
        c.relowner as owner_oid,
        count(*) filter (where c.relkind in ('r','p','f')) as tables_count, -- tables + partitioned + foreign
        count(*) filter (where c.relkind in ('v','m')) as views_count,
        count(*) filter (where c.relkind = 'S') as sequences_count
    from pg_class c
    group by c.relowner
) oc on oc.owner_oid = (select oid from r)
left join (
    select
        p.proowner as owner_oid,
        count(*) as functions_count
    from pg_proc p
    group by p.proowner
) fc on fc.owner_oid = (select oid from r)
left join (
    select
        t.typowner as owner_oid,
        count(*) as types_count
    from pg_type t
    where t.typtype in ('c','e','d')
    group by t.typowner
) tc on tc.owner_oid = (select oid from r)
group by oc.tables_count, oc.views_count, fc.functions_count, oc.sequences_count, tc.types_count;
`;
        const { rows } = await session.query<RoleStatsRecord>(sql, [roleName]);
        return rows[0] || {
            tables_count: 0,
            views_count: 0,
            functions_count: 0,
            sequences_count: 0,
            types_count: 0,
            total_objects: 0,
            role_size: "0 bytes",
            role_size_bytes: 0,
        };
    }

    const loadingStatsText = (value: any, row: RoleRecord) => {
        if (loadingStatsRow.includes(row)) {
            const Icon = icons!.Loading;
            return <Icon />;
        }
        return value;
    };

    const booleanFormatter = (value: any) => {
        return value ? (
            <Span color="success">{t("yes", "Yes")}</Span>
        ) : (
            <Span color="error">{t("no", "No")}</Span>
        );
    }

    return {
        id: cid("roles-editors-tab"),
        type: "tab",
        closable: false,
        label: {
            id: cid("roles-tab-label"),
            type: "tablabel",
            label: t("database-roles", "Roles"),
            icon: "Users",
        },
        content: {
            id: cid("roles-tab-content"),
            type: "tabcontent",
            content: {
                id: cid("roles-editor-splitter"),
                type: "split",
                direction: "vertical",
                autoSaveId: `roles-editor-splitter-${session.profile.sch_id}`,
                secondSize: 25,
                first: (slotContext) => ({
                    id: cid("roles-grid"),
                    type: "grid",
                    uniqueField: "role_name",
                    rows: async () => {
                        const sql = `
select
  r.rolname as role_name,
  r.rolsuper,
  r.rolcreaterole,
  r.rolcreatedb,
  r.rolcanlogin,
  r.rolinherit,
  r.rolreplication,
  r.rolbypassrls,
  null::text   as role_size,
  null::bigint as role_size_bytes,
  null::int    as tables_count,
  null::int    as views_count,
  null::int    as functions_count,
  null::int    as sequences_count,
  null::int    as types_count,
  null::int    as total_objects,
  sd.description as comment
from pg_roles r
left join pg_shdescription sd on sd.objoid = r.oid and sd.classoid = 'pg_authid'::regclass;
`;
                        const { rows } = await session.query<RoleRecord>(sql);
                        allRows = rows;
                        return rows;
                    },
                    columns: [
                        { key: "role_name", label: t("role-name", "Role"), dataType: "string", width: 220, sortDirection: "asc", sortOrder: 1 },
                        { key: "rolcanlogin", label: t("can-login", "Login"), dataType: "boolean", width: 80, formatter: booleanFormatter },
                        { key: "rolsuper", label: t("superuser", "Superuser"), dataType: "boolean", width: 100, formatter: booleanFormatter },
                        { key: "rolcreaterole", label: t("create-role", "Create Role"), dataType: "boolean", width: 110, formatter: booleanFormatter },
                        { key: "rolcreatedb", label: t("create-db", "Create DB"), dataType: "boolean", width: 100, formatter: booleanFormatter },
                        { key: "rolinherit", label: t("inherit", "Inherit"), dataType: "boolean", width: 90, formatter: booleanFormatter },
                        { key: "rolreplication", label: t("replication", "Replication"), dataType: "boolean", width: 110, formatter: booleanFormatter },
                        { key: "rolbypassrls", label: t("bypass-rls", "Bypass RLS"), dataType: "boolean", width: 110, formatter: booleanFormatter },
                        { key: "role_size", label: t("role-size", "Size"), dataType: "size", width: 130, formatter: loadingStatsText },
                        { key: "total_objects", label: t("total-objects", "Total Objects"), dataType: "number", width: 130, formatter: loadingStatsText },
                        { key: "tables_count", label: t("tables-count", "Tables"), dataType: "number", width: 100, formatter: loadingStatsText },
                        { key: "views_count", label: t("views-count", "Views"), dataType: "number", width: 100, formatter: loadingStatsText },
                        { key: "sequences_count", label: t("sequences-count", "Sequences"), dataType: "number", width: 110, formatter: loadingStatsText },
                        { key: "functions_count", label: t("functions-count", "Functions"), dataType: "number", width: 110, formatter: loadingStatsText },
                        { key: "types_count", label: t("types-count", "Types"), dataType: "number", width: 100, formatter: loadingStatsText },
                        { key: "comment", label: t("comment", "Comment"), dataType: "string", width: 360 },
                    ] as ColumnDefinition[],
                    onRowSelect: (row: RoleRecord | undefined, slotContext) => {
                        if (selectedRow?.role_name !== row?.role_name) {
                            selectedRow = row ?? null;
                            slotContext.refresh(cid("roles-editor"));
                        }
                    },
                    actions: [
                        {
                            id: "role-stats-refresh",
                            label: t("refresh-role-stats", "Refresh Role Stats"),
                            keySequence: ["Space"],
                            contextMenuGroupId: "role-stats",
                            contextMenuOrder: 1,
                            disabled: () => selectedRow === null || loadingStats,
                            run: async () => {
                                if (selectedRow) {
                                    const row = selectedRow;
                                    loadingStats = true;
                                    loadingStatsRow.push(row);
                                    slotContext.refresh(cid("roles-grid"), "only");
                                    slotContext.refresh(cid("roles-stats-progress"));
                                    try {
                                        const stats = await getRoleStats(row.role_name);
                                        Object.assign(row, stats);
                                    } finally {
                                        const index = loadingStatsRow.indexOf(row);
                                        if (index !== -1) loadingStatsRow.splice(index, 1);
                                        loadingStats = false;
                                        slotContext.refresh(cid("roles-grid"), "compute");
                                        slotContext.refresh(cid("roles-stats-progress"));
                                    }
                                }
                            },
                        },
                        {
                            id: "role-refresh-all",
                            label: () => loadingStats ? t("cancel-refresh-roles", "Cancel Refresh All Role Stats") : t("refresh-roles", "Refresh All Role Stats"),
                            keySequence: ["Alt+Shift+Enter"],
                            contextMenuGroupId: "role-stats",
                            contextMenuOrder: 2,
                            //disabled: () => loadingStats,
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
                                        slotContext.refresh(cid("roles-grid"), "only");
                                        slotContext.refresh(cid("roles-stats-progress"));
                                        try {
                                            const stats = await getRoleStats(row.role_name);
                                            Object.assign(row, stats);
                                        } finally {
                                            const index = loadingStatsRow.indexOf(row);
                                            if (index !== -1) loadingStatsRow.splice(index, 1);
                                            slotContext.refresh(cid("roles-grid"), "only");
                                            slotContext.refresh(cid("roles-stats-progress"));
                                        }
                                        if (!loadingStats) {
                                            break;
                                        }
                                    }
                                } finally {
                                    loadingStats = false;
                                    loadingProgress = null;
                                    slotContext.refresh(cid("roles-grid"), "compute");
                                    slotContext.refresh(cid("roles-stats-progress"));
                                }
                            }
                        }
                    ],
                    autoSaveId: `roles-grid-${session.profile.sch_id}`,
                    statuses: ["data-rows"],
                    progress: {
                        id: cid("roles-stats-progress"),
                        type: "progress",
                        display: () => loadingStats,
                        value: () => loadingProgress,
                    },
                } as IGridSlot),
                second: {
                    id: cid("roles-editor"),
                    type: "editor",
                    lineNumbers: false,
                    readOnly: true,
                    miniMap: false,
                    content: async () => {
                        if (!selectedRow) return "-- No role selected";
                        return [
                            await session.query<{ source: string }>(roleCreateDdl(versionNumber), [selectedRow.role_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(roleMembershipDdl(versionNumber), [selectedRow.role_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            await session.query<{ source: string }>(roleConfigDdl(versionNumber), [selectedRow.role_name]).then(res => res.rows.map(row => row.source).join("\n")),
                            //await session.query<{ source: string }>(roleGrantsDdl(versionNumber), [selectedRow.role_name]).then(res => res.rows.map(row => row.source).join("\n")),
                        ].filter(Boolean).join("\n\n") ?? "-- No DDL available";
                    },
                },
            },
        },
        toolBar: {
            id: cid("roles-toolbar"),
            type: "toolbar",
            tools: [],
            actionSlotId: cid("roles-grid"),
        }
    };
}