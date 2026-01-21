import i18next from "i18next";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { IEditorSlot, IGridSlot, ITabSlot, ITextSlot, SlotRuntimeContext } from "../../../../../manager/renderer/CustomSlots";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { listOwnedObjects, listPrivileges, buildCleanupSql, OwnedObjectRecord, PrivilegeRecord, CleanupChoice, PrivilegeChoice, isValidCleanupAction, DependencyInfo, CodeUsage, TableStats, SecurityContext, analyzeDependencies, findUsagesInCode, getTableStats, checkSecurityContext, RiskAssessment, assessDependencyRisk, assessCodeUsageRisk, assessTableStatsRisk, assessSecurityContextRisk, RiskLevel, analyzeForeignKeyDependencies, assessForeignKeyRisk, assessOverallRisk } from "./roleAudit";
import { versionToNumber } from "../../../../../../src/api/version";
import { SelectRoleAction, SelectRoleAction_ID } from "../../../actions/SelectRoleAction";
import { SelectRoleGroup } from "../../../actions/SelectRoleGroup";
import debounce from "@renderer/utils/debounce";
import { Box, Stack, Typography } from "@mui/material";
import Tooltip from "@renderer/components/Tooltip";
import { tableDdl } from "../../../../common/ddls/table";
import { viewDdl } from "../../../../common/ddls/view";
import { sequenceDdl } from "../../../../common/ddls/sequence";
import { schemaDdl } from "../../../../common/ddls/schema";

const roleCleanupTab = (session: IDatabaseSession): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;
    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");

    let targetOwner: string | null = null;
    let lastReassignOwner: Record<string, any> = { "new-owner": null };
    let lastMoveObject: Record<string, any> = { "new-schema": null, "new-owner": null };
    let analyzingObject = false;
    let analyzingProgress: number | null = null;
    const analyzingRows: any[] = [];

    let selectedOwnedObject: OwnedObjectRecord | null = null;
    let selectedPrivilege: PrivilegeRecord | null = null;

    let ownedCache: OwnedObjectRecord[] = [];
    let privsCache: PrivilegeRecord[] = [];
    let objectCache: Record<string, {
        ddl?: string,
        depInfo?: DependencyInfo,
        codeUsages?: CodeUsage[],
        tableStats?: TableStats | null,
        securityContext?: SecurityContext | null,
        risk?: {
            dependency: RiskAssessment,
            codeUsage: RiskAssessment,
            tableStats: RiskAssessment,
            securityContext: RiskAssessment,
            foreignKey: RiskAssessment,
            overall: RiskAssessment,
        }
    }> = {};

    let selectedRole: string | null = null;
    const setSelectedRoleName = async () => {
        try {
            const { rows } = await session.query<{ role_name: string }>('select current_user as role_name');
            selectedRole = rows[0]?.role_name ?? null;
            lastReassignOwner["new-owner"] = selectedRole;
        } catch (e) {
            selectedRole = null;
        }
    };
    let roleNameList: string[] = [];
    const loadRoleNameList = async () => {
        try {
            const { rows } = await session.query<{ rolname: string }>(
                `select rolname
                 from pg_roles
                 order by rolname`);
            roleNameList = rows.map(r => r.rolname);
        } catch (e) {
            roleNameList = [];
        }
    };
    let schemanameList: string[] = [];
    const loadSchemaNameList = async () => {
        try {
            const { rows } = await session.query<{ nspname: string }>(
                `select nspname
                 from pg_namespace
                 where nspname not like 'pg_%' and nspname <> 'information_schema'
                 order by nspname`);
            schemanameList = rows.map(r => r.nspname);
        } catch (e) {
            schemanameList = [];
        }
    };
    let isSuperuser: boolean | null = null;
    const superuserCheck = async () => {
        try {
            const { rows } = await session.query<{ is_superuser: boolean }>(
                `SELECT usesuper as is_superuser FROM pg_user WHERE usename = current_user`
            );
            isSuperuser = rows[0]?.is_superuser ?? false;
        } catch (e) {
            isSuperuser = false;
        }
    };

    const editorRefresh = debounce((runtimeContext: SlotRuntimeContext) => {
        runtimeContext.refresh(cid("role-cleanup-editor"));
    }, 1000);

    const objectDllKey = (objtype: string, schema: string | null, name: string) => {
        return `${objtype}||${schema || ""}||${name}`;
    };

    const objectDdl = async (obj: OwnedObjectRecord) => {
        try {
            if (obj.objtype === "table") {
                return await tableDdl(session, obj.schema!, obj.name);
            } else if (obj.objtype === "view" || obj.objtype === "matview") {
                return await viewDdl(session, obj.schema!, obj.name);
            } else if (obj.objtype === "sequence") {
                return await sequenceDdl(session, obj.schema!, obj.name);
            } else if (obj.objtype === "schema") {
                return await schemaDdl(session, obj.name);
            }
            return t("ddl-preview-not-available", '-- DDL preview not available for object type: {{obj.objtype}} --', { objtype: obj.objtype });
        } catch (e) {
            return t("ddl-preview-error", '-- Error fetching DDL preview for {{obj.name}} --', { name: obj.name });
        }
    };

    const analyzeObject = async (obj: OwnedObjectRecord) => {
        const [depInfo, fkDeps, codeUsages, tableStats, securityContext,] = await Promise.all([
            analyzeDependencies(session, obj.objtype, obj.schema, obj.name),
            obj.objtype === 'table'
                ? analyzeForeignKeyDependencies(session, obj.schema!, obj.name)
                : Promise.resolve([]),
            obj.objtype === 'table' || obj.objtype === 'view' || obj.objtype === 'matview' || obj.objtype === 'function' || obj.objtype === 'procedure'
                ? findUsagesInCode(session, obj.schema!, obj.name)
                : Promise.resolve([]),
            obj.objtype === 'table'
                ? getTableStats(session, obj.schema!, obj.name)
                : Promise.resolve(null),
            obj.objtype === 'function'
                ? checkSecurityContext(session, obj.objtype, obj.schema!, obj.identity)
                : Promise.resolve(null)
        ]);

        const dependencyRisk = assessDependencyRisk(depInfo);
        const codeUsageRisk = assessCodeUsageRisk(codeUsages);
        const tableStatsRisk = assessTableStatsRisk(tableStats);
        const securityContextRisk = assessSecurityContextRisk(securityContext);
        const foreignKeyRisk = assessForeignKeyRisk(fkDeps);
        const overallRisk = assessOverallRisk(dependencyRisk, codeUsageRisk, tableStatsRisk, securityContextRisk, foreignKeyRisk);
        const risk = {
            dependency: dependencyRisk,
            codeUsage: codeUsageRisk,
            tableStats: tableStatsRisk,
            securityContext: securityContextRisk,
            foreignKey: foreignKeyRisk,
            overall: overallRisk,
        }

        return { depInfo, codeUsages, tableStats, securityContext, risk };

    };

    const RiskLevelIcon = (props: { level: RiskLevel, slotContext: SlotRuntimeContext }) => {
        const { level, slotContext } = props;
        if (level === "low") {
            return <slotContext.theme.icons.Check color="info" />;
        } else if (level === "medium") {
            return <slotContext.theme.icons.Warning color="warning" />;
        } else if (level === "high") {
            return <slotContext.theme.icons.Error color="warning" />;
        } else if (level === "critical") {
            return <slotContext.theme.icons.Error color="error" />;
        }
        return <slotContext.theme.icons.Check color="success" />;
    }

    return {
        id: cid("role-cleanup-tab"),
        type: "tab",
        onMount: (slotContext) => {
            (async () => {
                await setSelectedRoleName();
                await superuserCheck();
                slotContext.refresh(cid("role-cleanup-selected-role-label"));
                slotContext.refresh(cid("role-owned-grid"));
                slotContext.refresh(cid("role-privs-grid"));
                slotContext.refresh(cid("role-cleanup-tab-label"));
            })();
            loadRoleNameList();
            loadSchemaNameList();
        },
        label: {
            id: cid("role-cleanup-tab-label"),
            type: "tablabel",
            label: (slotContext) => {
                return (
                    <Stack direction="row" gap={4}>
                        {t("role-cleanup", "Role Cleanup")}
                        {isSuperuser === false && (
                            <Tooltip title={t("role-non-superuser-warning", "You are not connected as a superuser. Results may be incomplete.")}>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <slotContext.theme.icons.Info color="warning" />
                                </div>
                            </Tooltip>
                        )}
                    </Stack>
                );
            },
            icon: "UserRemove"
        },
        content: {
            id: cid("role-cleanup-tab-content"),
            type: "tabcontent",
            actions: [
                SelectRoleAction(),
            ],
            actionGroups: (slotContext) => [
                SelectRoleGroup(session, () => selectedRole, (roleName: string | null) => {
                    selectedRole = roleName;
                    slotContext.refresh(cid("role-cleanup-selected-role-label"));
                    slotContext.refresh(cid("role-owned-grid"));
                    slotContext.refresh(cid("role-privs-grid"));
                    editorRefresh(slotContext);
                })
            ],
            content: (slotContext) => ({
                id: cid("role-cleanup-split"),
                type: "split",
                direction: "vertical",
                secondSize: 40,
                autoSaveId: `role-cleanup-split-view-${session.profile.sch_id}`,
                first: {
                    id: cid("role-data-tabs"),
                    type: "tabs",
                    tabs: [
                        {
                            id: cid("role-owners-tab"),
                            type: "tab",
                            label: {
                                id: cid("role-owners-tab-label"),
                                type: "tablabel",
                                label: t("role-owned-objects", "Owned Objects"),
                            },
                            content: {
                                id: cid("role-owners-tab-content"),
                                type: "tabcontent",
                                content: {
                                    id: cid("role-owners-split"),
                                    type: "split",
                                    direction: "horizontal",
                                    autoSaveId: `role-cleanup-owners-split-${session.profile.sch_id}`,
                                    first: {
                                        id: cid("role-owned-grid"),
                                        type: "grid",
                                        autoSaveId: `role-cleanup-owned-grid-${session.profile.sch_id}`,
                                        statuses: ["data-rows"],
                                        canSelectRows: true,
                                        rows: async () => {
                                            if (!selectedRole || isSuperuser === null) return [];
                                            ownedCache = await listOwnedObjects(session, selectedRole, versionNumber, isSuperuser);
                                            objectCache = {};
                                            editorRefresh(slotContext);
                                            return ownedCache;
                                        },
                                        columns: [
                                            { key: "objtype", label: t("type", "Type"), width: 120, dataType: "string" },
                                            { key: "schema", label: t("schema", "Schema"), width: 140, dataType: "string", sortDirection: "asc", sortOrder: 1 },
                                            { key: "identity", label: t("name", "Name"), width: 240, dataType: "string", sortDirection: "asc", sortOrder: 2 },
                                            { key: "owner", label: t("owner", "Owner"), width: 140, dataType: "string" },
                                            {
                                                key: "risk", label: t("risk-level", "Risk"), width: 40, dataType: "string",
                                                formatter: (value: RiskLevel | null, row) => {
                                                    if (analyzingRows.indexOf(row) >= 0) {
                                                        return <slotContext.theme.icons.Loading />;
                                                    }
                                                    if (!value) {
                                                        return null;
                                                    }
                                                    return <RiskLevelIcon level={value || "none"} slotContext={slotContext} />;
                                                }
                                            },
                                            {
                                                key: "choice", label: t("action", "Action"), width: 150, dataType: "object",
                                                formatter: (value: CleanupChoice | undefined, _row) => {
                                                    if (value?.action === "drop_restrict") {
                                                        return <Stack direction="row" gap={4}>
                                                            <slotContext.theme.icons.DropRestrict color="warning" />
                                                            {t("drop", "Drop")}
                                                        </Stack>;
                                                    }
                                                    else if (value?.action === "drop_cascade") {
                                                        return <Stack direction="row" gap={4}>
                                                            <slotContext.theme.icons.DropCascade color="error" />
                                                            {t("drop-cascade", "Drop Cascade")}
                                                        </Stack>;
                                                    } else if (value?.action === "reassign") {
                                                        return <Stack direction="row" gap={4}>
                                                            <slotContext.theme.icons.ReassignUser color="secondary" />
                                                            {t("reassign-to", "Reassign to {{owner}}", { owner: value.newOwner ?? targetOwner })}
                                                        </Stack>;
                                                    } else if (value?.action === "move") {
                                                        return <Stack direction="row" gap={4}>
                                                            <slotContext.theme.icons.MoveObject color="success" />
                                                            {t("move-to", "Move to {{schema}} / {{owner}}", {
                                                                schema: value.newSchema,
                                                                owner: value.newOwner ?? t("<current-owner>", "<current_owner>"),
                                                            })}
                                                        </Stack>;
                                                    }
                                                    return <span>{t("no-action", "No Action")}</span>;
                                                }
                                            },
                                        ] as ColumnDefinition[],
                                        onRowSelect: (row) => {
                                            if (selectedOwnedObject?.identity !== row?.identity) {
                                                selectedOwnedObject = row;
                                                if (selectedOwnedObject) {
                                                    slotContext.refresh(cid("role-owned-ddl"));
                                                    slotContext.refresh(cid("role-owned-info"));
                                                    slotContext.refresh(cid("role-owners-tab-toolbar"));
                                                }
                                            }
                                        },
                                        actions: [
                                            {
                                                id: "drop-restrict-owned-objects-action",
                                                label: t("drop-object", "Drop Object"),
                                                icon: <slotContext.theme.icons.DropRestrict color="warning" />,
                                                keySequence: ["Ctrl+D"],
                                                contextMenuGroupId: "cleanup-actions",
                                                contextMenuOrder: 1,
                                                run: (context) => {
                                                    const position = context.getPosition();
                                                    if (!position) return;

                                                    let selectedRows = context.getSelectedRows();
                                                    selectedRows = (selectedRows.length ? selectedRows : [position.row]);

                                                    selectedRows.forEach(rowIdx => {
                                                        const row = context.getData(rowIdx);
                                                        if (row?.choice?.action === "drop_restrict") {
                                                            row.choice = null;
                                                        }
                                                        else if (isValidCleanupAction(row.objtype, "drop_restrict")) {
                                                            row.choice = { action: "drop_restrict" };
                                                        }
                                                    });
                                                    selectedRows.length = 0;
                                                    slotContext.refresh(cid("role-owned-grid"), "only");
                                                    editorRefresh(slotContext);
                                                }
                                            },
                                            {
                                                id: "drop-cascade-owned-objects-action",
                                                label: t("drop-object-cascade", "Drop Object Cascade"),
                                                icon: <slotContext.theme.icons.DropCascade color="error" />,
                                                keySequence: ["Ctrl+Shift+D"],
                                                contextMenuGroupId: "cleanup-actions",
                                                contextMenuOrder: 2,
                                                run: (context) => {
                                                    const position = context.getPosition();
                                                    if (!position) return;

                                                    let selectedRows = context.getSelectedRows();
                                                    selectedRows = (selectedRows.length ? selectedRows : [position.row]);

                                                    selectedRows.forEach(rowIdx => {
                                                        const row = context.getData(rowIdx);
                                                        if (row?.choice?.action === "drop_cascade") {
                                                            row.choice = null;
                                                        }
                                                        else if (isValidCleanupAction(row.objtype, "drop_cascade")) {
                                                            row.choice = { action: "drop_cascade" };
                                                        }
                                                    });
                                                    selectedRows.length = 0;
                                                    slotContext.refresh(cid("role-owned-grid"), "only");
                                                    editorRefresh(slotContext);
                                                }
                                            },
                                            {
                                                id: "reassign-owner-action",
                                                label: t("reassign-owner", "Reassign Owner"),
                                                icon: <slotContext.theme.icons.ReassignUser color="secondary" />,
                                                keySequence: ["Ctrl+R"],
                                                contextMenuGroupId: "cleanup-actions",
                                                contextMenuOrder: 3,
                                                run: (context) => {
                                                    const position = context.getPosition();
                                                    if (!position) return;

                                                    let selectedRows = context.getSelectedRows();
                                                    selectedRows = (selectedRows.length ? selectedRows : [position.row]);
                                                    if (selectedRows.length === 1) {
                                                        const row = context.getData(selectedRows[0]);
                                                        if (row?.choice?.action === "reassign") {
                                                            row.choice = null;
                                                            selectedRows.length = 0;
                                                            slotContext.refresh(cid("role-owned-grid"), "only");
                                                            editorRefresh(slotContext);
                                                            return;
                                                        }
                                                    }

                                                    if (selectedRows.every(rowIdx => {
                                                        const row = context.getData(rowIdx);
                                                        return !isValidCleanupAction(row.objtype, "reassign");
                                                    })) {
                                                        return;
                                                    }

                                                    slotContext.openDialog(cid("role-cleanup-reassign-owner-dialog"), lastReassignOwner).then((result) => {
                                                        if (result) {
                                                            lastReassignOwner = result;

                                                            selectedRows.forEach(rowIdx => {
                                                                const row = context.getData(rowIdx);
                                                                if (isValidCleanupAction(row.objtype, "reassign")) {
                                                                    row.choice = {
                                                                        action: "reassign",
                                                                        newOwner: result["new-owner"],
                                                                    };
                                                                }
                                                            });
                                                            selectedRows.length = 0;
                                                            slotContext.refresh(cid("role-owned-grid"), "only");
                                                            editorRefresh(slotContext);
                                                        }
                                                    });
                                                }
                                            },
                                            {
                                                id: "move-object-action",
                                                label: t("move-object", "Move Object"),
                                                icon: <slotContext.theme.icons.MoveObject color="success" />,
                                                keySequence: ["Ctrl+M"],
                                                contextMenuGroupId: "cleanup-actions",
                                                contextMenuOrder: 4,
                                                run: (context) => {
                                                    const position = context.getPosition();
                                                    if (!position) return;

                                                    let selectedRows = context.getSelectedRows();
                                                    selectedRows = (selectedRows.length ? selectedRows : [position.row]);
                                                    if (selectedRows.length === 1) {
                                                        const row = context.getData(selectedRows[0]);
                                                        if (row?.choice?.action === "move") {
                                                            row.choice = null;
                                                            selectedRows.length = 0;
                                                            slotContext.refresh(cid("role-owned-grid"), "only");
                                                            editorRefresh(slotContext);
                                                            return;
                                                        }
                                                    }

                                                    if (selectedRows.every(rowIdx => {
                                                        const row = context.getData(rowIdx);
                                                        return !isValidCleanupAction(row.objtype, "move");
                                                    })) {
                                                        return;
                                                    }

                                                    slotContext.openDialog(cid("role-cleanup-move-object-dialog"), lastMoveObject).then((result) => {
                                                        if (result) {
                                                            lastMoveObject = result;
                                                            selectedRows.forEach(rowIdx => {
                                                                const row = context.getData(rowIdx);
                                                                if (isValidCleanupAction(row.objtype, "move")) {
                                                                    row.choice = {
                                                                        action: "move",
                                                                        newSchema: result["new-schema"],
                                                                        newOwner: result["new-owner"],
                                                                    };
                                                                }
                                                            });
                                                            selectedRows.length = 0;
                                                            slotContext.refresh(cid("role-owned-grid"), "only");
                                                            editorRefresh(slotContext);
                                                        }
                                                    });
                                                }
                                            },
                                            {
                                                id: "clear-object-action",
                                                label: t("clear-action", "Clear Action"),
                                                icon: <slotContext.theme.icons.Clear />,
                                                keySequence: ["Ctrl+Q"],
                                                contextMenuGroupId: "cleanup-actions",
                                                contextMenuOrder: 5,
                                                run: (context) => {
                                                    const position = context.getPosition();
                                                    if (!position) return;
                                                    let selectedRows = context.getSelectedRows();
                                                    selectedRows = (selectedRows.length ? selectedRows : [position.row]);
                                                    selectedRows.forEach(rowIdx => {
                                                        const row = context.getData(rowIdx);
                                                        row.choice = null;
                                                    });
                                                    selectedRows.length = 0;
                                                    slotContext.refresh(cid("role-owned-grid"), "only");
                                                    editorRefresh(slotContext);
                                                }
                                            },
                                            {
                                                id: "reload-info-refresh",
                                                label: t("reload-object-info", "Reload Object Info"),
                                                icon: "Reload",
                                                keySequence: ["Space"],
                                                contextMenuGroupId: "reload-actions",
                                                contextMenuOrder: 1,
                                                disabled: () => selectedOwnedObject === null || analyzingObject,
                                                run: async () => {
                                                    if (selectedOwnedObject) {
                                                        const row = selectedOwnedObject;
                                                        analyzingObject = true;
                                                        analyzingRows.push(row);
                                                        slotContext.refresh(cid("role-owned-grid"), "only");
                                                        slotContext.refresh(cid("role-owned-progress"));
                                                        slotContext.refresh(cid("role-owners-tab-toolbar"));
                                                        slotContext.refresh(cid("role-owned-info"));
                                                        try {
                                                            const key = objectDllKey(selectedOwnedObject.objtype, selectedOwnedObject.schema || null, selectedOwnedObject.identity);
                                                            const result = await analyzeObject(selectedOwnedObject);
                                                            objectCache[key] = {
                                                                ...objectCache[key],
                                                                ...result,
                                                            };
                                                            selectedOwnedObject.risk = result?.risk?.overall?.level;
                                                        } finally {
                                                            const index = analyzingRows.indexOf(row);
                                                            if (index !== -1) {
                                                                analyzingRows.splice(index, 1);
                                                            }
                                                            analyzingObject = false;
                                                            slotContext.refresh(cid("role-owned-grid"), "only");
                                                            slotContext.refresh(cid("role-owned-progress"));
                                                            slotContext.refresh(cid("role-owners-tab-toolbar"));
                                                            slotContext.refresh(cid("role-owned-info"));
                                                        }
                                                    }
                                                },
                                            },
                                            {
                                                id: "reload-info-refresh-all",
                                                label: () => analyzingObject ? t("cancel-reload-info", "Cancel Reload All Object Info") : t("reload-info", "Reload All Object Info"),
                                                icon: () => analyzingObject ? "ReloadStop" : "ReloadAll",
                                                keySequence: ["Alt+Shift+Enter"],
                                                contextMenuGroupId: "reload-actions",
                                                contextMenuOrder: 2,
                                                //disabled: () => loadingStats,
                                                run: async () => {
                                                    if (analyzingObject) {
                                                        analyzingObject = false;
                                                        return;
                                                    }
                                                    analyzingObject = true;
                                                    slotContext.refresh(cid("schemas-toolbar"));
                                                    try {
                                                        for (const [index, row] of ownedCache.entries()) {
                                                            analyzingProgress = Math.round(((index + 1) / ownedCache.length) * 100);
                                                            analyzingRows.push(row);
                                                            slotContext.refresh(cid("role-owned-grid"), "only");
                                                            slotContext.refresh(cid("role-owned-progress"));
                                                            slotContext.refresh(cid("role-owners-tab-toolbar"));
                                                            slotContext.refresh(cid("role-owned-info"));
                                                            try {
                                                                const key = objectDllKey(row.objtype, row.schema || null, row.identity);
                                                                const result = await analyzeObject(row);
                                                                objectCache[key] = {
                                                                    ...objectCache[key],
                                                                    ...result,
                                                                };
                                                                row.risk = result?.risk?.overall?.level;
                                                            } finally {
                                                                const index = analyzingRows.indexOf(row);
                                                                if (index !== -1) {
                                                                    analyzingRows.splice(index, 1);
                                                                }
                                                                slotContext.refresh(cid("role-owned-grid"), "only");
                                                            }
                                                            if (!analyzingObject) {
                                                                break;
                                                            }
                                                        };
                                                    }
                                                    finally {
                                                        analyzingObject = false;
                                                        analyzingProgress = null;
                                                        slotContext.refresh(cid("role-owned-grid"), "compute");
                                                        slotContext.refresh(cid("role-owned-progress"));
                                                        slotContext.refresh(cid("role-owners-tab-toolbar"));
                                                        slotContext.refresh(cid("role-owned-info"));
                                                    }
                                                }
                                            }
                                        ],
                                        progress: {
                                            id: cid("role-owned-progress"),
                                            type: "progress",
                                            display: () => analyzingObject,
                                            value: () => analyzingProgress,
                                        },
                                    } as IGridSlot,
                                    second: {
                                        id: cid("role-owned-tabs"),
                                        type: "tabs",
                                        tabs: [
                                            {
                                                id: cid("role-owned-info-tab"),
                                                type: "tab",
                                                label: {
                                                    id: cid("role-owned-info-tab-label"),
                                                    type: "tablabel",
                                                    label: t("info", "Info"),
                                                },
                                                content: {
                                                    id: cid("role-owned-info"),
                                                    type: "tabcontent",
                                                    content: () => ({
                                                        id: cid("role-owned-info-risk"),
                                                        type: "column",
                                                        items: () => [
                                                            {
                                                                id: cid("role-owned-info-risk-analyzing"),
                                                                type: "rendered",
                                                                render: () => {
                                                                    if (!selectedOwnedObject) {
                                                                        return (
                                                                            <Typography variant="body1" component="div">
                                                                                {t("select-object-to-see-info", "Select an object to see info")}
                                                                            </Typography>
                                                                        );
                                                                    }
                                                                    return (
                                                                        <Box>
                                                                            <Typography variant="body1" component="div">
                                                                                {selectedOwnedObject.objtype}: {selectedOwnedObject.schema}.{selectedOwnedObject.name}
                                                                            </Typography>
                                                                            {analyzingRows.indexOf(selectedOwnedObject) >= 0 && (
                                                                                <Typography variant="body1" component="div" style={{ display: "flex", alignItems: "center", gap: "8px" }} >
                                                                                    <slotContext.theme.icons.Loading />
                                                                                    {t("analyzing-object", "Analyzing...")}
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                    );
                                                                }
                                                            },
                                                            {
                                                                id: cid("role-owned-info-dependency-risk"),
                                                                type: "rendered",
                                                                render: () => {
                                                                    if (!selectedOwnedObject || analyzingObject) {
                                                                        return null;
                                                                    }
                                                                    const key = objectDllKey(selectedOwnedObject.objtype, selectedOwnedObject.schema || null, selectedOwnedObject.identity);
                                                                    const risk = objectCache[key]?.risk?.overall;
                                                                    if (!risk) {
                                                                        return null;
                                                                    }
                                                                    return (
                                                                        <Stack gap={4}>
                                                                            <Typography variant="h6" component="div" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                                <RiskLevelIcon level={risk.level} slotContext={slotContext} />
                                                                                {t("overall-risk-assessment", "Overall Risk")}
                                                                            </Typography>
                                                                            <hr style={{ width: "98%" }} />
                                                                            {risk.reasons.map((reason, idx) => (
                                                                                <Typography variant="body2" component="div" key={idx}>{reason}</Typography>
                                                                            ))}
                                                                            <hr style={{ width: "98%" }} />
                                                                            {risk.warnings.map((warning, idx) => (
                                                                                <Typography variant="body2" component="div" color="warning" key={idx}>{warning}</Typography>
                                                                            ))}
                                                                        </Stack>
                                                                    )
                                                                },
                                                            },
                                                        ]
                                                    }),
                                                }
                                            },
                                            {
                                                id: cid("role-owned-ddl-tab"),
                                                type: "tab",
                                                label: {
                                                    id: cid("role-owned-ddl-tab-label"),
                                                    type: "tablabel",
                                                    label: t("ddl", "DDL"),
                                                },
                                                content: {
                                                    id: cid("role-owned-ddl-tab-content"),
                                                    type: "tabcontent",
                                                    content: {
                                                        id: cid("role-owned-ddl"),
                                                        type: "editor",
                                                        readOnly: true,
                                                        miniMap: false,
                                                        content: async () => {
                                                            if (!selectedOwnedObject) {
                                                                return t("select-object-to-see-ddl-preview", "-- Select an object to see DDL preview --");
                                                            }
                                                            const key = objectDllKey(selectedOwnedObject.objtype, selectedOwnedObject.schema || null, selectedOwnedObject.identity);
                                                            if (objectCache[key]?.ddl) {
                                                                return objectCache[key].ddl;
                                                            }
                                                            objectCache[key] = { ...objectCache[key], ddl: await objectDdl(selectedOwnedObject) };
                                                            return objectCache[key].ddl;
                                                        },
                                                    },
                                                },
                                            }
                                        ] as ITabSlot[],
                                    }
                                },
                            },
                            toolBar: {
                                id: cid("role-owners-tab-toolbar"),
                                type: "toolbar",
                                tools: [
                                    [
                                        "drop-restrict-owned-objects-action",
                                        "drop-cascade-owned-objects-action",
                                        "reassign-owner-action",
                                        "move-object-action",
                                    ],
                                    "clear-object-action",
                                    [
                                        "reload-info-refresh",
                                        "reload-info-refresh-all",
                                    ]
                                ],
                                actionSlotId: cid("role-owned-grid"),
                            }
                        },
                        {
                            id: cid("role-privs-tab"),
                            type: "tab",
                            label: {
                                id: cid("role-privs-tab-label"),
                                type: "tablabel",
                                label: t("role-privileges", "Privileges"),
                            },
                            content: {
                                id: cid("role-privs-tab-content"),
                                type: "tabcontent",
                                content: {
                                    id: cid("role-privs-split"),
                                    type: "split",
                                    direction: "horizontal",
                                    autoSaveId: `role-cleanup-privs-split-${session.profile.sch_id}`,
                                    first: {
                                        id: cid("role-privs-grid"),
                                        type: "grid",
                                        autoSaveId: `role-cleanup-privs-grid-${session.profile.sch_id}`,
                                        statuses: ["data-rows"],
                                        canSelectRows: true,
                                        rows: async () => {
                                            if (!selectedRole) return [];
                                            privsCache = await listPrivileges(session, selectedRole, versionNumber);
                                            objectCache = {};
                                            editorRefresh(slotContext);
                                            return privsCache;
                                        },
                                        columns: [
                                            { key: "objtype", label: t("type", "Type"), width: 120, dataType: "string" },
                                            { key: "schema", label: t("schema", "Schema"), width: 140, dataType: "string", sortDirection: "asc", sortOrder: 1 },
                                            { key: "identity", label: t("name", "Name"), width: 240, dataType: "string", sortDirection: "asc", sortOrder: 2 },
                                            { key: "privilege_type", label: t("privilege", "Privilege"), width: 160, dataType: "string", sortDirection: "asc", sortOrder: 3 },
                                            { key: "is_grantable", label: t("grantable", "Grantable"), width: 100, dataType: "boolean" },
                                            { key: "grantee_name", label: t("grantee", "Grantee"), width: 160, dataType: "string" },
                                            { key: "grantor_name", label: t("grantor", "Grantor"), width: 160, dataType: "string" },
                                            {
                                                key: "choice", label: t("action", "Action"), width: 150, dataType: "object",
                                                formatter: (value: PrivilegeChoice | undefined, _row) => {
                                                    if (value?.action === "revoke") {
                                                        return <Stack direction="row" gap={4}>
                                                            <slotContext.theme.icons.RevokePrivileges color="warning" />
                                                            {t("revoke", "Revoke")}
                                                        </Stack>;
                                                    }
                                                    else if (value?.action === "revoke_grant_option") {
                                                        return <Stack direction="row" gap={4}>
                                                            <slotContext.theme.icons.RevokeAdminOption color="error" />
                                                            {t("revoke-admin-option", "Revoke Admin Option")}
                                                        </Stack>;
                                                    }
                                                    return <span>{t("no-action", "No Action")}</span>;
                                                }
                                            }
                                        ] as ColumnDefinition[],
                                        onRowSelect: (row) => {
                                            if (selectedPrivilege && selectedPrivilege?.objtype === row.objtype && selectedPrivilege?.schema === row.schema && selectedPrivilege?.name === row.name) {
                                                return;
                                            }
                                            selectedPrivilege = row;
                                            slotContext.refresh(cid("role-privs-ddl"));
                                        },
                                        actions: [
                                            {
                                                id: "revoke-privilege-action",
                                                label: t("revoke-privilege", "Revoke Privilege"),
                                                icon: <slotContext.theme.icons.RevokePrivileges color="warning" />,
                                                keySequence: ["Ctrl+R"],
                                                contextMenuGroupId: "privilege-actions",
                                                contextMenuOrder: 1,
                                                run: (context) => {
                                                    const position = context.getPosition();
                                                    if (!position) return;
                                                    let selectedRows = context.getSelectedRows();
                                                    selectedRows = (selectedRows.length ? selectedRows : [position.row]);
                                                    selectedRows.forEach(rowIdx => {
                                                        const row = context.getData(rowIdx);
                                                        if (row?.choice?.action === "revoke") {
                                                            row.choice = null;
                                                        }
                                                        else {
                                                            row.choice = { action: "revoke" };
                                                        }
                                                    });
                                                    selectedRows.length = 0;
                                                    slotContext.refresh(cid("role-privs-grid"), "only");
                                                    editorRefresh(slotContext);
                                                }
                                            },
                                            {
                                                id: "revoke-admin-option-action",
                                                label: t("revoke-admin-option", "Revoke Admin Option"),
                                                icon: <slotContext.theme.icons.RevokeAdminOption color="error" />,
                                                keySequence: ["Ctrl+Shift+R"],
                                                contextMenuGroupId: "privilege-actions",
                                                contextMenuOrder: 2,
                                                run: (context) => {
                                                    const position = context.getPosition();
                                                    if (!position) return;
                                                    let selectedRows = context.getSelectedRows();
                                                    selectedRows = (selectedRows.length ? selectedRows : [position.row]);
                                                    selectedRows.forEach(rowIdx => {
                                                        const row = context.getData(rowIdx);
                                                        if (row?.choice?.action === "revoke_grant_option") {
                                                            row.choice = null;
                                                        }
                                                        else if (row.is_grantable) {
                                                            row.choice = { action: "revoke_grant_option" };
                                                        }
                                                    });
                                                    selectedRows.length = 0;
                                                    slotContext.refresh(cid("role-privs-grid"), "only");
                                                    editorRefresh(slotContext);
                                                }
                                            },
                                            {
                                                id: "clear-privilege-action",
                                                label: t("clear-action", "Clear Action"),
                                                icon: <slotContext.theme.icons.Clear />,
                                                keySequence: ["Ctrl+Q"],
                                                contextMenuGroupId: "privilege-actions",
                                                contextMenuOrder: 3,
                                                run: (context) => {
                                                    const position = context.getPosition();
                                                    if (!position) return;
                                                    let selectedRows = context.getSelectedRows();
                                                    selectedRows = (selectedRows.length ? selectedRows : [position.row]);
                                                    selectedRows.forEach(rowIdx => {
                                                        const row = context.getData(rowIdx);
                                                        row.choice = null;
                                                    });
                                                    selectedRows.length = 0;
                                                    slotContext.refresh(cid("role-privs-grid"), "only");
                                                    editorRefresh(slotContext);
                                                }
                                            }
                                        ],
                                    } as IGridSlot,
                                    second: {
                                        id: cid("role-privs-ddl"),
                                        type: "editor",
                                        readOnly: true,
                                        miniMap: false,
                                        content: async () => {
                                            if (!selectedPrivilege) {
                                                return "-- Select a privilege to see DDL preview --";
                                            }

                                            const key = objectDllKey(selectedPrivilege.objtype, selectedPrivilege.schema || null, selectedPrivilege.identity);
                                            if (objectCache[key]?.ddl) {
                                                return objectCache[key].ddl;
                                            }

                                            return `-- DDL preview not available for privileges --`;
                                        },
                                    }
                                },
                            },
                            toolBar: {
                                id: cid("role-privilege-tab-toolbar"),
                                type: "toolbar",
                                tools: [
                                    [
                                        "revoke-privilege-action",
                                        "revoke-admin-option-action",
                                    ],
                                    "clear-privilege-action",
                                ],
                                actionSlotId: cid("role-privs-grid"),
                            }
                        }
                    ],
                },
                second: {
                    id: cid("role-cleanup-editor"),
                    type: "editor",
                    content: async () => {
                        if (!selectedRole) return "-- No role selected --";

                        const sql = buildCleanupSql(ownedCache, privsCache, {
                            roleName: selectedRole,
                            newOwner: targetOwner ?? "",
                            ownedChoices: ownedCache.reduce((acc: Record<string, CleanupChoice>, obj: Record<string, any>) => {
                                if (obj?.choice && obj?.identity) {
                                    acc[obj.identity] = obj.choice as CleanupChoice;
                                }
                                return acc;
                            }, {}),
                            privilegeChoices: privsCache.reduce((acc: Record<string, PrivilegeChoice>, priv: Record<string, any>) => {
                                if (priv?.choice && priv?.identity) {
                                    acc[`${priv.identity}|${priv.privilege_type}|${priv.grantee_name}|${priv.grantor_name}`] = priv.choice as PrivilegeChoice;
                                }
                                return acc;
                            }, {}),
                        });

                        return sql;
                    },
                } as IEditorSlot,
            }),
            dialogs: [
                {
                    id: cid("role-cleanup-reassign-owner-dialog"),
                    type: "dialog",
                    title: t("reassing-owner", "Reassign Owner"),
                    items: () => [
                        {
                            key: "new-owner",
                            type: "select",
                            label: t("new-owner", "New Owner"),
                            required: true,
                            options: [
                                { label: t("role-select-new-owner-placeholder", "Select new owner..."), value: null },
                                ...roleNameList.map(rn => ({ label: rn, value: rn })),
                            ],
                            autoFocus: true,
                        }
                    ],
                },
                {
                    id: cid("role-cleanup-move-object-dialog"),
                    type: "dialog",
                    title: t("move-object", "Move Object"),
                    items: () => [
                        {
                            key: "new-schema",
                            type: "select",
                            label: t("new-schema", "New Schema"),
                            required: true,
                            options: [
                                { label: t("schema-select-new-schema-placeholder", "Select new schema..."), value: null },
                                ...schemanameList.map(sn => ({ label: sn, value: sn })),
                            ],
                            autoFocus: true,
                        },
                        {
                            key: "new-owner",
                            type: "select",
                            label: t("new-owner", "New Owner"),
                            options: [
                                { label: t("role-select-new-owner-placeholder", "Select new owner..."), value: null },
                                ...roleNameList.map(rn => ({ label: rn, value: rn })),
                            ],
                        }
                    ],
                    onValidate(values) {
                        if (!values["new-schema"]) {
                            return t("schema-required-error", "Schema is required.");
                        }
                    },
                }
            ],
        },
        toolBar: {
            id: cid("role-cleanup-title-toolbar"),
            type: "toolbar",
            tools: [
                SelectRoleAction_ID,
                {
                    id: cid("role-cleanup-selected-role-label"),
                    type: "text",
                    text: () => t("role-role", "Role: {{role}}", { role: selectedRole || t("none", "None") }),
                    maxLines: 1,
                } as ITextSlot,
            ],
            actionSlotId: cid("role-cleanup-tab-content"),
        },
    };
};

export default roleCleanupTab;