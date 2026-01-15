import i18next from "i18next";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { IEditorSlot, IGridSlot, ITabSlot, ITextSlot, SlotRuntimeContext } from "../../../../manager/renderer/CustomSlots";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { listOwnedObjects, listPrivileges, buildCleanupSql, OwnedObject, PrivilegeRecord, CleanupChoice, PrivilegeChoice } from "./roleAudit";
import { versionToNumber } from "../../../../../src/api/version";
import { SelectRoleAction, SelectRoleAction_ID } from "../../actions/SelectRoleAction";
import { SelectRoleGroup } from "../../actions/SelectRoleGroup";
import debounce from "@renderer/utils/debounce";
import { Stack } from "@mui/material";
import { Action } from "@renderer/components/CommandPalette/ActionManager";

const roleCleanupTab = (session: IDatabaseSession): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;
    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");

    let targetOwner: string | null = null;
    let lastReassignOwner: Record<string, any> = { "new-owner": null };

    let ownedCache: OwnedObject[] = [];
    let privsCache: PrivilegeRecord[] = [];

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

    const editorRefresh = debounce((runtimeContext: SlotRuntimeContext) => {
        runtimeContext.refresh(cid("role-cleanup-editor"));
    }, 1000);

    return {
        id: cid("role-cleanup-tab"),
        type: "tab",
        onMount: (slotContext) => {
            setSelectedRoleName().then(() => {
                slotContext.refresh(cid("role-cleanup-selected-role-label"));
                slotContext.refresh(cid("role-owned-grid"));
                slotContext.refresh(cid("role-privs-grid"));
            });
            loadRoleNameList();
            loadSchemaNameList();
        },
        label: {
            id: cid("role-cleanup-tab-label"),
            type: "tablabel",
            label: t("role-cleanup", "Role Cleanup"),
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
                                    id: cid("role-owned-grid"),
                                    type: "grid",
                                    autoSaveId: `role-cleanup-owned-grid-${session.profile.sch_id}`,
                                    statuses: ["data-rows"],
                                    canSelectRows: true,
                                    rows: async () => {
                                        if (!selectedRole) return [];
                                        ownedCache = await listOwnedObjects(session, selectedRole, versionNumber);
                                        return ownedCache;
                                    },
                                    columns: [
                                        { key: "objtype", label: t("type", "Type"), width: 120, dataType: "string" },
                                        { key: "schema", label: t("schema", "Schema"), width: 140, dataType: "string", sortDirection: "asc", sortOrder: 1 },
                                        { key: "name", label: t("name", "Name"), width: 240, dataType: "string", sortDirection: "asc", sortOrder: 2 },
                                        { key: "owner", label: t("owner", "Owner"), width: 140, dataType: "string" },
                                        { key: "identity", label: t("identity", "Identity"), width: 320, dataType: "string" },
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
                                                }
                                                return <span>{t("no-action", "No Action")}</span>;
                                            }
                                        },
                                    ] as ColumnDefinition[],
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

                                                const selectedRows = context.getSelectedRows();

                                                (selectedRows.length ? selectedRows : [position.row]).forEach(rowIdx => {
                                                    const row = context.getData(rowIdx);
                                                    if (row?.choice?.action === "drop_restrict") {
                                                        row.choice = null;
                                                    }
                                                    else {
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

                                                const selectedRows = context.getSelectedRows();

                                                (selectedRows.length ? selectedRows : [position.row]).forEach(rowIdx => {
                                                    const row = context.getData(rowIdx);
                                                    if (row?.choice?.action === "drop_cascade") {
                                                        row.choice = null;
                                                    }
                                                    else {
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

                                                slotContext.openDialog(cid("role-cleanup-select-new-owner-dialog"), lastReassignOwner).then((result) => {
                                                    if (result) {
                                                        lastReassignOwner = result;

                                                        selectedRows.forEach(rowIdx => {
                                                            const row = context.getData(rowIdx);
                                                            row.choice = {
                                                                action: "reassign",
                                                                newOwner: result["new-owner"],
                                                            };
                                                        });
                                                        selectedRows.length = 0;
                                                        slotContext.refresh(cid("role-owned-grid"), "only");
                                                        editorRefresh(slotContext);
                                                    }
                                                });
                                            }
                                        }
                                    ],
                                } as IGridSlot
                            },
                            toolBar: {
                                id: cid("role-owners-tab-toolbar"),
                                type: "toolbar",
                                tools: [
                                    "drop-restrict-owned-objects-action",
                                    "drop-cascade-owned-objects-action",
                                    "reassign-owner-action",
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
                                    id: cid("role-privs-grid"),
                                    type: "grid",
                                    rows: async () => {
                                        if (!selectedRole) return [];
                                        privsCache = await listPrivileges(session, selectedRole, versionNumber);
                                        return privsCache;
                                    },
                                    columns: [
                                        { key: "objtype", label: t("type", "Type"), width: 120, dataType: "string" },
                                        { key: "schema", label: t("schema", "Schema"), width: 140, dataType: "string", sortDirection: "asc", sortOrder: 1 },
                                        { key: "name", label: t("name", "Name"), width: 240, dataType: "string", sortDirection: "asc", sortOrder: 2 },
                                        { key: "privilege_type", label: t("privilege", "Privilege"), width: 160, dataType: "string", sortDirection: "asc", sortOrder: 3 },
                                        { key: "is_grantable", label: t("grantable", "Grantable"), width: 100, dataType: "boolean" },
                                        { key: "grantee_name", label: t("grantee", "Grantee"), width: 160, dataType: "string" },
                                        { key: "grantor_name", label: t("grantor", "Grantor"), width: 160, dataType: "string" },
                                        { key: "identity", label: t("identity", "Identity"), width: 320, dataType: "string" },
                                    ] as ColumnDefinition[],
                                    actions: [],
                                    autoSaveId: `role-cleanup-privs-grid-${session.profile.sch_id}`,
                                    statuses: ["data-rows"],
                                } as IGridSlot
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
                                    acc[priv.identity] = priv.choice as PrivilegeChoice;
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
                    id: cid("role-cleanup-select-new-owner-dialog"),
                    type: "dialog",
                    title: t("reassing-owner", "Reassign Owner"),
                    items: () => [
                        {
                            key: "new-owner",
                            type: "select",
                            label: t("new-owner", "New Owner"),
                            options: [
                                { label: t("role-select-new-owner-placeholder", "Select new owner..."), value: null },
                                ...roleNameList.map(rn => ({ label: rn, value: rn })),
                            ],
                            autoFocus: true,
                        }
                    ],
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