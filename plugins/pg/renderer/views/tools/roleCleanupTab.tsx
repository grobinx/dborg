import i18next from "i18next";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { IEditorSlot, IGridSlot, ITabSlot, ITextSlot, SlotFactoryContext } from "../../../../manager/renderer/CustomSlots";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { listOwnedObjects, listPrivileges, buildCleanupSql, OwnedObject, PrivilegeRecord, CleanupChoice, PrivilegeChoice } from "./roleAudit";
import { versionToNumber } from "../../../../../src/api/version";
import { SelectRoleAction, SelectRoleAction_ID } from "../../actions/SelectRoleAction";
import { SelectRoleGroup } from "../../actions/SelectRoleGroup";
import { icons } from "@renderer/themes/ThemeWrapper";
import debounce, { Debounced } from "@renderer/utils/debounce";
import { RefreshSlotFunction } from "@renderer/containers/ViewSlots/RefreshSlotContext";
import { Stack } from "@mui/material";

const roleCleanupTab = (session: IDatabaseSession): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;
    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");

    let targetOwner: string | null = null;

    let ownedCache: OwnedObject[] = [];
    let privsCache: PrivilegeRecord[] = [];

    let selectedRole: string | null = null;
    const setSelectedRoleName = async () => {
        try {
            const { rows } = await session.query<{ role_name: string }>('select current_user as role_name');
            selectedRole = rows[0]?.role_name ?? null;
        } catch (e) {
            selectedRole = null;
        }
    };

    const editorRefresh = debounce((slotContext: SlotFactoryContext) => {
        slotContext.refresh(cid("role-cleanup-editor"));
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
            actionGroups: (refresh: any) => [
                SelectRoleGroup(session, () => selectedRole, (roleName: string | null) => {
                    selectedRole = roleName;
                    refresh(cid("role-cleanup-selected-role-label"));
                    refresh(cid("role-owned-grid"));
                    refresh(cid("role-privs-grid"));
                    editorRefresh(refresh);
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
                                            key: "choice", label: t("action", "Action"), width: 36, dataType: "object",
                                            formatter: (value: CleanupChoice | undefined, row) => {
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
                                                }
                                                return <span>{t("no-action", "No Action")}</span>;
                                            }
                                        },
                                    ] as ColumnDefinition[],
                                    actions: [
                                        {
                                            id: "drop-restrict-owned-objects-action",
                                            label: t("drop-object-restrict", "Drop Object Restrict"),
                                            icon: <slotContext.theme.icons.DropRestrict color="warning" />,
                                            keySequence: ["Ctrl+D"],
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
                                            label: t("drop-cascade-object", "Drop Object Cascade"),
                                            icon: <slotContext.theme.icons.DropCascade color="error" />,
                                            keySequence: ["Ctrl+Shift+D"],
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
                                    ],
                                } as IGridSlot
                            },
                            toolBar: {
                                id: cid("role-owners-tab-toolbar"),
                                type: "toolbar",
                                tools: [
                                    "drop-restrict-owned-objects-action",
                                    "drop-cascade-owned-objects-action",
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
                } as ITextSlot
            ],
            actionSlotId: cid("role-cleanup-tab-content"),
        },
    };
};

export default roleCleanupTab;