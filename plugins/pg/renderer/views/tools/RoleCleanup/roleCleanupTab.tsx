import i18next from "i18next";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { IEditorSlot, IGridSlot, ITabSlot, ITextSlot, SlotRuntimeContext } from "../../../../../manager/renderer/CustomSlots";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { listOwnedObjects, listPrivileges, buildCleanupSql, OwnedObjectRecord, PrivilegeRecord, CleanupChoice, PrivilegeChoice, isValidCleanupAction } from "./roleAudit";
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
import { cidFactory } from "@renderer/containers/ViewSlots/helpers";
import ObjectSafetyAnalyzer, { AnalysisResult, RiskLevel } from "./objectAnalyze";

const roleCleanupTab = (session: IDatabaseSession): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = cidFactory("tools-role-cleanup", session.info.uniqueId);
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
    let ddlCache: Record<string, string> = {};
    const osa = new ObjectSafetyAnalyzer(session);

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
        runtimeContext.refresh(cid("editor"));
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

    const analyzeObject = async (obj: OwnedObjectRecord): Promise<AnalysisResult | null> => {
        if (obj.schema === null) {
            return null;
        }
        return await new Promise<AnalysisResult | null>((resolve) => {
            resolve(osa.analyzeObjectSafety(obj.schema!, obj.name));
        });
    }

    const RiskLevelIcon = (props: { level: RiskLevel | null, slotContext: SlotRuntimeContext }) => {
        const { level, slotContext } = props;
        if (level === "low") {
            return <slotContext.theme.icons.Check color="success" />;
        } else if (level === "medium") {
            return <slotContext.theme.icons.Warning color="warning" />;
        } else if (level === "high") {
            return <slotContext.theme.icons.Error color="warning" />;
        } else if (level === "critical") {
            return <slotContext.theme.icons.Error color="error" />;
        }
        return null;
    }

    return {
        id: cid("tab"),
        type: "tab",
        onMount: (slotContext) => {
            (async () => {
                await setSelectedRoleName();
                await superuserCheck();
                slotContext.refresh(cid("selected-role-label"));
                slotContext.refresh(cid("owned-grid"));
                slotContext.refresh(cid("privs-grid"));
                slotContext.refresh(cid("tab-label"));
            })();
            loadRoleNameList();
            loadSchemaNameList();
        },
        label: {
            id: cid("tab", "label"),
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
            id: cid("tab", "content"),
            type: "tabcontent",
            actions: [
                SelectRoleAction(),
            ],
            actionGroups: (slotContext) => [
                SelectRoleGroup(session, () => selectedRole, (roleName: string | null) => {
                    selectedRole = roleName;
                    analyzingObject = false;
                    slotContext.refresh(cid("selected-role-label"));
                    slotContext.refresh(cid("owned-grid"));
                    slotContext.refresh(cid("privs-grid"));
                    editorRefresh(slotContext);
                })
            ],
            content: (slotContext) => ({
                type: "split",
                direction: "vertical",
                secondSize: 40,
                autoSaveId: `role-cleanup-split-view-${session.profile.sch_id}`,
                first: {
                    type: "tabs",
                    tabs: [
                        {
                            id: cid("owned-tab"),
                            type: "tab",
                            label: {
                                id: cid("owned-tab-label"),
                                type: "tablabel",
                                label: t("role-owned-objects", "Owned Objects"),
                            },
                            content: {
                                id: cid("owned-tab-content"),
                                type: "tabcontent",
                                content: {
                                    id: cid("owned-split"),
                                    type: "split",
                                    direction: "horizontal",
                                    autoSaveId: `role-cleanup-owned-split-${session.profile.sch_id}`,
                                    first: {
                                        id: cid("owned-grid"),
                                        type: "grid",
                                        autoSaveId: `role-cleanup-owned-grid-${session.profile.sch_id}`,
                                        statuses: ["data-rows"],
                                        canSelectRows: true,
                                        rows: async () => {
                                            if (!selectedRole || isSuperuser === null) return [];
                                            ownedCache = await listOwnedObjects(session, selectedRole, versionNumber, isSuperuser);
                                            ddlCache = {};
                                            analyzingObject = false;
                                            editorRefresh(slotContext);
                                            setTimeout(async () => {
                                                for (const row of ownedCache) {
                                                    row.risk = await analyzeObject(row);
                                                }
                                                slotContext.refresh(cid("owned-grid"), "compute");
                                            }, 0);
                                            return ownedCache;
                                        },
                                        columns: [
                                            { key: "objtype", label: t("type", "Type"), width: 120, dataType: "string" },
                                            { key: "schema", label: t("schema", "Schema"), width: 140, dataType: "string", sortDirection: "asc", sortOrder: 1 },
                                            { key: "identity", label: t("name", "Name"), width: 240, dataType: "string", sortDirection: "asc", sortOrder: 2 },
                                            { key: "owner", label: t("owner", "Owner"), width: 140, dataType: "string" },
                                            {
                                                key: "risk", label: t("risk-level", "Risk"), width: 40, dataType: "string",
                                                formatter: (value: AnalysisResult | null, row) => {
                                                    if (analyzingRows.indexOf(row) >= 0) {
                                                        return <slotContext.theme.icons.Loading />;
                                                    }
                                                    if (!value) {
                                                        return null;
                                                    }
                                                    return (<Stack direction="row" gap={2}>
                                                        <RiskLevelIcon level={value.assessment?.canDelete.level || null} slotContext={slotContext} />
                                                        <RiskLevelIcon level={value.assessment?.canChangeOwner.level || null} slotContext={slotContext} />
                                                        <RiskLevelIcon level={value.assessment?.canMove.level || null} slotContext={slotContext} />
                                                    </Stack>);
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
                                                    slotContext.refresh(cid("owned-ddl-editor"));
                                                    slotContext.refresh(cid("owned-info"));
                                                    slotContext.refresh(cid("owned-toolbar"));
                                                }
                                            }
                                        },
                                        actions: [
                                            {
                                                id: "role-cleanup-owned-drop-restrict-action",
                                                label: t("drop-object", "Drop Object"),
                                                icon: <slotContext.theme.icons.DropRestrict color="warning" />,
                                                keySequence: ["Ctrl+D"],
                                                contextMenuGroupId: "cleanup-actions",
                                                contextMenuOrder: 1,
                                                run: (context) => {
                                                    const selectedRows = context.getSelectedRowsData();
                                                    if (selectedRows.length === 0) {
                                                        return;
                                                    }

                                                    selectedRows.forEach(row => {
                                                        if (row?.choice?.action === "drop_restrict") {
                                                            row.choice = null;
                                                        }
                                                        else if (isValidCleanupAction(row.objtype, "drop_restrict")) {
                                                            row.choice = { action: "drop_restrict" };
                                                        }
                                                    });
                                                    context.clearSelectedRows();
                                                    editorRefresh(slotContext);
                                                }
                                            },
                                            {
                                                id: "role-cleanup-owned-drop-cascade-action",
                                                label: t("drop-object-cascade", "Drop Object Cascade"),
                                                icon: <slotContext.theme.icons.DropCascade color="error" />,
                                                keySequence: ["Ctrl+Shift+D"],
                                                contextMenuGroupId: "cleanup-actions",
                                                contextMenuOrder: 2,
                                                run: (context) => {
                                                    const selectedRows = context.getSelectedRowsData();
                                                    if (selectedRows.length === 0) {
                                                        return;
                                                    }

                                                    selectedRows.forEach(row => {
                                                        if (row?.choice?.action === "drop_cascade") {
                                                            row.choice = null;
                                                        }
                                                        else if (isValidCleanupAction(row.objtype, "drop_cascade")) {
                                                            row.choice = { action: "drop_cascade" };
                                                        }
                                                    });
                                                    context.clearSelectedRows();
                                                    editorRefresh(slotContext);
                                                }
                                            },
                                            {
                                                id: "role-cleanup-owned-reassign-action",
                                                label: t("reassign-owner", "Reassign Owner"),
                                                icon: <slotContext.theme.icons.ReassignUser color="secondary" />,
                                                keySequence: ["Ctrl+R"],
                                                contextMenuGroupId: "cleanup-actions",
                                                contextMenuOrder: 3,
                                                run: (context) => {
                                                    const selectedRows = context.getSelectedRowsData();
                                                    if (selectedRows.length === 0) {
                                                        return;
                                                    }

                                                    if (selectedRows.length === 1) {
                                                        const row = selectedRows[0];
                                                        if (row?.choice?.action === "reassign") {
                                                            row.choice = null;
                                                            context.clearSelectedRows();
                                                            editorRefresh(slotContext);
                                                            return;
                                                        }
                                                    }

                                                    if (selectedRows.every(row => {
                                                        return !isValidCleanupAction(row.objtype, "reassign");
                                                    })) {
                                                        return;
                                                    }

                                                    slotContext.openDialog(cid("dialog-reassign-owner"), lastReassignOwner).then((result) => {
                                                        if (result) {
                                                            lastReassignOwner = result;

                                                            selectedRows.forEach(row => {
                                                                if (isValidCleanupAction(row.objtype, "reassign")) {
                                                                    row.choice = {
                                                                        action: "reassign",
                                                                        newOwner: result["new-owner"],
                                                                    };
                                                                }
                                                            });
                                                            context.clearSelectedRows();
                                                            editorRefresh(slotContext);
                                                        }
                                                    });
                                                }
                                            },
                                            {
                                                id: "role-cleanup-owned-move-action",
                                                label: t("move-object", "Move Object"),
                                                icon: <slotContext.theme.icons.MoveObject color="success" />,
                                                keySequence: ["Ctrl+M"],
                                                contextMenuGroupId: "cleanup-actions",
                                                contextMenuOrder: 4,
                                                run: (context) => {
                                                    const selectedRows = context.getSelectedRowsData();
                                                    if (selectedRows.length === 0) {
                                                        return;
                                                    }

                                                    if (selectedRows.length === 1) {
                                                        const row = selectedRows[0];
                                                        if (row?.choice?.action === "move") {
                                                            row.choice = null;
                                                            context.clearSelectedRows();
                                                            editorRefresh(slotContext);
                                                            return;
                                                        }
                                                    }

                                                    if (selectedRows.every(row => {
                                                        return !isValidCleanupAction(row.objtype, "move");
                                                    })) {
                                                        return;
                                                    }

                                                    slotContext.openDialog(cid("dialog-move-object"), lastMoveObject).then((result) => {
                                                        if (result) {
                                                            lastMoveObject = result;
                                                            selectedRows.forEach(row => {
                                                                if (isValidCleanupAction(row.objtype, "move")) {
                                                                    row.choice = {
                                                                        action: "move",
                                                                        newSchema: result["new-schema"],
                                                                        newOwner: result["new-owner"],
                                                                    };
                                                                }
                                                            });
                                                            context.clearSelectedRows();
                                                            editorRefresh(slotContext);
                                                        }
                                                    });
                                                }
                                            },
                                            {
                                                id: "role-cleanup-owned-clear-action",
                                                label: t("clear-action", "Clear Action"),
                                                icon: <slotContext.theme.icons.Clear />,
                                                keySequence: ["Ctrl+Q"],
                                                contextMenuGroupId: "cleanup-actions",
                                                contextMenuOrder: 5,
                                                run: (context) => {
                                                    const selectedRows = context.getSelectedRowsData();
                                                    if (selectedRows.length === 0) {
                                                        return;
                                                    }

                                                    selectedRows.forEach(row => {
                                                        row.choice = null;
                                                    });
                                                    context.clearSelectedRows();
                                                    editorRefresh(slotContext);
                                                }
                                            },
                                            // {
                                            //     id: "role-cleanup-owned-reload-action",
                                            //     label: t("reload-object-info", "Reload Object Info"),
                                            //     icon: "Reload",
                                            //     keySequence: ["Space"],
                                            //     contextMenuGroupId: "reload-actions",
                                            //     contextMenuOrder: 1,
                                            //     disabled: () => selectedOwnedObject === null || analyzingObject,
                                            //     run: async () => {
                                            //         if (selectedOwnedObject) {
                                            //             const row = selectedOwnedObject;
                                            //             analyzingObject = true;
                                            //             analyzingRows.push(row);
                                            //             slotContext.refresh(cid("owned-grid"), "only");
                                            //             slotContext.refresh(cid("owned-progress"));
                                            //             slotContext.refresh(cid("owned-toolbar"));
                                            //             slotContext.refresh(cid("owned-info"));
                                            //             try {
                                            //                 selectedOwnedObject.risk = await analyzeObject(selectedOwnedObject);
                                            //             } finally {
                                            //                 const index = analyzingRows.indexOf(row);
                                            //                 if (index !== -1) {
                                            //                     analyzingRows.splice(index, 1);
                                            //                 }
                                            //                 analyzingObject = false;
                                            //                 slotContext.refresh(cid("owned-grid"), "only");
                                            //                 slotContext.refresh(cid("owned-progress"));
                                            //                 slotContext.refresh(cid("owned-toolbar"));
                                            //                 slotContext.refresh(cid("owned-info"));
                                            //             }
                                            //         }
                                            //     },
                                            // },
                                            // {
                                            //     id: "role-cleanup-owned-reload-all-action",
                                            //     label: () => analyzingObject ? t("cancel-reload-info", "Cancel Reload All Object Info") : t("reload-info", "Reload All Object Info"),
                                            //     icon: () => analyzingObject ? "ReloadStop" : "ReloadAll",
                                            //     keySequence: ["Alt+Shift+Enter"],
                                            //     contextMenuGroupId: "reload-actions",
                                            //     contextMenuOrder: 2,
                                            //     run: async () => {
                                            //         if (analyzingObject) {
                                            //             analyzingObject = false;
                                            //             return;
                                            //         }
                                            //         analyzingObject = true;
                                            //         slotContext.refresh(cid("schemas-toolbar"));
                                            //         let tc = Date.now() - 250;
                                            //         try {
                                            //             for (const [index, row] of ownedCache.entries()) {
                                            //                 analyzingProgress = Math.round(((index + 1) / ownedCache.length) * 100);
                                            //                 analyzingRows.push(row);
                                            //                 if (Date.now() - tc > 250) {
                                            //                     slotContext.refresh(cid("owned-grid"), "only");
                                            //                     slotContext.refresh(cid("owned-progress"));
                                            //                     slotContext.refresh(cid("owned-toolbar"));
                                            //                     slotContext.refresh(cid("owned-info"));
                                            //                     tc = Date.now();
                                            //                     await new Promise(resolve => setTimeout(resolve, 0));
                                            //                 }
                                            //                 try {
                                            //                     row.risk = await analyzeObject(row);
                                            //                 } finally {
                                            //                     const index = analyzingRows.indexOf(row);
                                            //                     if (index !== -1) {
                                            //                         analyzingRows.splice(index, 1);
                                            //                     }
                                            //                 }

                                            //                 if (!analyzingObject) {
                                            //                     break;
                                            //                 }
                                            //             };
                                            //         }
                                            //         finally {
                                            //             analyzingObject = false;
                                            //             analyzingProgress = null;
                                            //             slotContext.refresh(cid("owned-grid"), "compute");
                                            //             slotContext.refresh(cid("owned-progress"));
                                            //             slotContext.refresh(cid("owned-toolbar"));
                                            //             slotContext.refresh(cid("owned-info"));
                                            //         }
                                            //     }
                                            // }
                                        ],
                                        progress: {
                                            id: cid("owned-progress"),
                                            type: "progress",
                                            display: () => analyzingObject,
                                            value: () => analyzingProgress,
                                        },
                                    } as IGridSlot,
                                    second: {
                                        id: cid("owned-tabs"),
                                        type: "tabs",
                                        tabs: [
                                            {
                                                id: cid("owned-overall-tab"),
                                                type: "tab",
                                                label: {
                                                    id: cid("owned-overall-tab-label"),
                                                    type: "tablabel",
                                                    label: t("overall", "Overall"),
                                                },
                                                content: {
                                                    id: cid("owned-info"),
                                                    type: "tabcontent",
                                                    content: () => ({
                                                        id: cid("owned-info-risk"),
                                                        type: "column",
                                                        padding: 8,
                                                        items: [
                                                            {
                                                                id: cid("owned-info-analyzing"),
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
                                                                            {(analyzingRows.indexOf(selectedOwnedObject) >= 0 || (analyzingObject && !selectedOwnedObject.risk)) && (
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
                                                                id: cid("owned-info-risk-details"),
                                                                type: "rendered",
                                                                render: () => {
                                                                    if (!selectedOwnedObject) {
                                                                        return null;
                                                                    }
                                                                    const risk = selectedOwnedObject.risk as AnalysisResult | null;
                                                                    if (!risk) {
                                                                        return null;
                                                                    }

                                                                    // Nagłówek z podstawowymi informacjami
                                                                    const header = (
                                                                        <Stack gap={2}>
                                                                            {!risk.found && !risk.error && (
                                                                                <Typography variant="body2" color="warning">
                                                                                    {t("object-not-found", "Object not found in metadata.")}
                                                                                </Typography>
                                                                            )}
                                                                            {risk.error && (
                                                                                <Typography variant="body2" color="error">
                                                                                    {t("error", "Error")}: {risk.error}
                                                                                </Typography>
                                                                            )}
                                                                        </Stack>
                                                                    );

                                                                    // Oceny operacji (jeśli dostępne)
                                                                    const assessment = risk.assessment;
                                                                    const ops = assessment ? [
                                                                        { key: "canDelete", label: t("delete", "Delete"), value: assessment.canDelete },
                                                                        { key: "canChangeOwner", label: t("change-owner", "Change Owner"), value: assessment.canChangeOwner },
                                                                        { key: "canMove", label: t("move", "Move"), value: assessment.canMove },
                                                                    ] : [];

                                                                    return (
                                                                        <Stack gap={6}>
                                                                            {header}

                                                                            {assessment && (
                                                                                <Stack gap={3}>
                                                                                    <Typography variant="subtitle1" component="div">
                                                                                        {t("risk-assessment", "Risk assessment")}
                                                                                    </Typography>
                                                                                    <Stack gap={2}>
                                                                                        {ops.map(op => (
                                                                                            <Box key={op.key} sx={{ border: "1px solid #ddd", borderRadius: 4, padding: 8 }}>
                                                                                                <Typography variant="body2" component="div">
                                                                                                    {op.value.message}
                                                                                                </Typography>
                                                                                                {op.value.details?.length > 0 && (
                                                                                                    <Stack component="ul" sx={{ pl: 2, mt: 1 }} gap={0.5}>
                                                                                                        {op.value.details.map((d, idx) => (
                                                                                                            <div key={idx}>
                                                                                                                <Typography variant="body2" component="span">{d}</Typography>
                                                                                                            </div>
                                                                                                        ))}
                                                                                                    </Stack>
                                                                                                )}
                                                                                            </Box>
                                                                                        ))}
                                                                                    </Stack>
                                                                                </Stack>
                                                                            )}
                                                                        </Stack>
                                                                    );
                                                                },
                                                            },
                                                        ]
                                                    }),
                                                }
                                            },
                                            {
                                                id: cid("owned-ddl-tab"),
                                                type: "tab",
                                                label: {
                                                    id: cid("owned-ddl-tab-label"),
                                                    type: "tablabel",
                                                    label: t("ddl", "DDL"),
                                                },
                                                content: {
                                                    id: cid("owned-ddl-tab-content"),
                                                    type: "tabcontent",
                                                    content: {
                                                        id: cid("owned-ddl-editor"),
                                                        type: "editor",
                                                        readOnly: true,
                                                        miniMap: false,
                                                        content: async () => {
                                                            if (!selectedOwnedObject) {
                                                                return t("select-object-to-see-ddl-preview", "-- Select an object to see DDL preview --");
                                                            }
                                                            const key = objectDllKey(selectedOwnedObject.objtype, selectedOwnedObject.schema || null, selectedOwnedObject.identity);
                                                            if (ddlCache[key]) {
                                                                return ddlCache[key];
                                                            }
                                                            ddlCache[key] = await objectDdl(selectedOwnedObject);
                                                            return ddlCache[key];
                                                        },
                                                    },
                                                },
                                            }
                                        ] as ITabSlot[],
                                    }
                                },
                            },
                            toolBar: {
                                id: cid("owned-toolbar"),
                                type: "toolbar",
                                tools: [
                                    [
                                        "role-cleanup-owned-drop-restrict-action",
                                        "role-cleanup-owned-drop-cascade-action",
                                        "role-cleanup-owned-reassign-action",
                                        "role-cleanup-owned-move-action",
                                    ],
                                    "role-cleanup-owned-clear-action",
                                    // [
                                    //     "role-cleanup-owned-reload-action",
                                    //     "role-cleanup-owned-reload-all-action",
                                    // ]
                                ],
                                actionSlotId: cid("owned-grid"),
                            }
                        },
                        {
                            id: cid("privs-tab"),
                            type: "tab",
                            label: {
                                id: cid("privs-tab-label"),
                                type: "tablabel",
                                label: t("role-privileges", "Privileges"),
                            },
                            content: {
                                id: cid("privs-tab-content"),
                                type: "tabcontent",
                                content: {
                                    type: "split",
                                    direction: "horizontal",
                                    autoSaveId: `role-cleanup-privs-split-${session.profile.sch_id}`,
                                    first: {
                                        id: cid("privs-grid"),
                                        type: "grid",
                                        autoSaveId: `role-cleanup-privs-grid-${session.profile.sch_id}`,
                                        statuses: ["data-rows"],
                                        canSelectRows: true,
                                        rows: async () => {
                                            if (!selectedRole) return [];
                                            privsCache = await listPrivileges(session, selectedRole, versionNumber);
                                            ddlCache = {};
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
                                            slotContext.refresh(cid("privs-ddl-editor"));
                                        },
                                        actions: [
                                            {
                                                id: "role-cleanup-privs-revoke-action",
                                                label: t("revoke-privilege", "Revoke Privilege"),
                                                icon: <slotContext.theme.icons.RevokePrivileges color="warning" />,
                                                keySequence: ["Ctrl+R"],
                                                contextMenuGroupId: "privilege-actions",
                                                contextMenuOrder: 1,
                                                run: (context) => {
                                                    const selectedRows = context.getSelectedRowsData();
                                                    if (selectedRows.length === 0) {
                                                        return;
                                                    }

                                                    selectedRows.forEach(row => {
                                                        if (row?.choice?.action === "revoke") {
                                                            row.choice = null;
                                                        }
                                                        else {
                                                            row.choice = { action: "revoke" };
                                                        }
                                                    });
                                                    context.clearSelectedRows();
                                                    editorRefresh(slotContext);
                                                }
                                            },
                                            {
                                                id: "role-cleanup-privs-revoke-admin-action",
                                                label: t("revoke-admin-option", "Revoke Admin Option"),
                                                icon: <slotContext.theme.icons.RevokeAdminOption color="error" />,
                                                keySequence: ["Ctrl+Shift+R"],
                                                contextMenuGroupId: "privilege-actions",
                                                contextMenuOrder: 2,
                                                run: (context) => {
                                                    const selectedRows = context.getSelectedRowsData();
                                                    if (selectedRows.length === 0) {
                                                        return;
                                                    }
                                                    selectedRows.forEach(row => {
                                                        if (row?.choice?.action === "revoke_grant_option") {
                                                            row.choice = null;
                                                        }
                                                        else if (row.is_grantable) {
                                                            row.choice = { action: "revoke_grant_option" };
                                                        }
                                                    });
                                                    context.clearSelectedRows();
                                                    editorRefresh(slotContext);
                                                }
                                            },
                                            {
                                                id: "role-cleanup-privs-clear-action",
                                                label: t("clear-action", "Clear Action"),
                                                icon: <slotContext.theme.icons.Clear />,
                                                keySequence: ["Ctrl+Q"],
                                                contextMenuGroupId: "privilege-actions",
                                                contextMenuOrder: 3,
                                                run: (context) => {
                                                    const selectedRows = context.getSelectedRowsData();
                                                    if (selectedRows.length === 0) {
                                                        return;
                                                    }
                                                    selectedRows.forEach(row => {
                                                        row.choice = null;
                                                    });
                                                    context.clearSelectedRows();
                                                    editorRefresh(slotContext);
                                                }
                                            }
                                        ],
                                    } as IGridSlot,
                                    second: {
                                        id: cid("privs-ddl-editor"),
                                        type: "editor",
                                        readOnly: true,
                                        miniMap: false,
                                        content: async () => {
                                            if (!selectedPrivilege) {
                                                return "-- Select a privilege to see DDL preview --";
                                            }

                                            const key = objectDllKey(selectedPrivilege.objtype, selectedPrivilege.schema || null, selectedPrivilege.identity);
                                            if (ddlCache[key]) {
                                                return ddlCache[key];
                                            }

                                            return `-- DDL preview not available for privileges --`;
                                        },
                                    }
                                },
                            },
                            toolBar: {
                                id: cid("privs-toolbar"),
                                type: "toolbar",
                                tools: [
                                    [
                                        "role-cleanup-privs-revoke-action",
                                        "role-cleanup-privs-revoke-admin-action",
                                    ],
                                    "role-cleanup-privs-clear-action",
                                ],
                                actionSlotId: cid("privs-grid"),
                            }
                        }
                    ],
                },
                second: {
                    id: cid("editor"),
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
                    id: cid("dialog-reassign-owner"),
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
                    id: cid("dialog-move-object"),
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
            id: cid("title-toolbar"),
            type: "toolbar",
            tools: [
                SelectRoleAction_ID,
                {
                    id: cid("selected-role-label"),
                    type: "text",
                    text: () => t("role-role", "Role: {{role}}", { role: selectedRole || t("none", "None") }),
                    maxLines: 1,
                } as ITextSlot,
            ],
            actionSlotId: cid("tab-content"),
        },
    };
};

export default roleCleanupTab;