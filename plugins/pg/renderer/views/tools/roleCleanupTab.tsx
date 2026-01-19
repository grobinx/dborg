import i18next from "i18next";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { IEditorSlot, IGridSlot, ITabSlot, ITextSlot, SlotRuntimeContext } from "../../../../manager/renderer/CustomSlots";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { listOwnedObjects, listPrivileges, buildCleanupSql, OwnedObjectRecord, PrivilegeRecord, CleanupChoice, PrivilegeChoice, isValidCleanupAction } from "./roleAudit";
import { versionToNumber } from "../../../../../src/api/version";
import { SelectRoleAction, SelectRoleAction_ID } from "../../actions/SelectRoleAction";
import { SelectRoleGroup } from "../../actions/SelectRoleGroup";
import debounce from "@renderer/utils/debounce";
import { Stack } from "@mui/material";
import Tooltip from "@renderer/components/Tooltip";
import { tableDdl } from "../../../common/ddls/table";
import { viewDdl } from "../../../common/ddls/view";
import { sequenceDdl } from "../../../common/ddls/sequence";
import { schemaDdl } from "../../../common/ddls/schema";

const roleCleanupTab = (session: IDatabaseSession): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;
    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");

    let targetOwner: string | null = null;
    let lastReassignOwner: Record<string, any> = { "new-owner": null };
    let lastMoveObject: Record<string, any> = { "new-schema": null, "new-owner": null };

    let selectedOwnedObject: OwnedObjectRecord | null = null;
    let selectedPrivilege: PrivilegeRecord | null = null;

    let ownedCache: OwnedObjectRecord[] = [];
    let privsCache: PrivilegeRecord[] = [];
    const objectDlls: Record<string, string> = {};

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

    const objectDllsKey = (objtype: string, schema: string | null, name: string) => {
        return `${objtype}||${schema || ""}||${name}`;
    };

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
                                            editorRefresh(slotContext);
                                            return ownedCache;
                                        },
                                        columns: [
                                            { key: "objtype", label: t("type", "Type"), width: 120, dataType: "string" },
                                            { key: "schema", label: t("schema", "Schema"), width: 140, dataType: "string", sortDirection: "asc", sortOrder: 1 },
                                            { key: "name", label: t("name", "Name"), width: 240, dataType: "string", sortDirection: "asc", sortOrder: 2 },
                                            { key: "owner", label: t("owner", "Owner"), width: 140, dataType: "string" },
                                            //{ key: "identity", label: t("identity", "Identity"), width: 320, dataType: "string" },
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
                                            selectedOwnedObject = row;
                                            slotContext.refresh(cid("role-owned-ddl"));
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
                                            }
                                        ],
                                    } as IGridSlot,
                                    second: {
                                        id: cid("role-owned-ddl"),
                                        type: "editor",
                                        readOnly: true,
                                        miniMap: false,
                                        content: async () => {
                                            if (!selectedOwnedObject) {
                                                return "-- Select an object to see DDL preview --";
                                            }
                                            const key = objectDllsKey(selectedOwnedObject.objtype, selectedOwnedObject.schema || null, selectedOwnedObject.name);
                                            if (objectDlls[key]) {
                                                return objectDlls[key];
                                            }
                                            if (selectedOwnedObject.objtype === "table") {
                                                objectDlls[key] = await tableDdl(session, selectedOwnedObject.schema!, selectedOwnedObject.name);
                                                return objectDlls[key];
                                            } else if (selectedOwnedObject.objtype === "view" || selectedOwnedObject.objtype === "matview") {
                                                objectDlls[key] = await viewDdl(session, selectedOwnedObject.schema!, selectedOwnedObject.name);
                                                return objectDlls[key];
                                            } else if (selectedOwnedObject.objtype === "sequence") {
                                                objectDlls[key] = await sequenceDdl(session, selectedOwnedObject.schema!, selectedOwnedObject.name);
                                                return objectDlls[key];
                                            } else if (selectedOwnedObject.objtype === "schema") {
                                                objectDlls[key] = await schemaDdl(session, selectedOwnedObject.name);
                                                return objectDlls[key];
                                            }
                                            return "-- DDL preview not available for this object type --";
                                        },
                                    }
                                },
                            },
                            toolBar: {
                                id: cid("role-owners-tab-toolbar"),
                                type: "toolbar",
                                tools: [
                                    "drop-restrict-owned-objects-action",
                                    "drop-cascade-owned-objects-action",
                                    "reassign-owner-action",
                                    "move-object-action",
                                    "clear-object-action",
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
                                            //{ key: "identity", label: t("identity", "Identity"), width: 320, dataType: "string" },
                                            {
                                                key: "choice", label: t("action", "Action"), width: 150, dataType: "object",
                                                formatter: (value: PrivilegeChoice | undefined, _row) => {
                                                    if (value?.action === "revoke") {
                                                        return <Stack direction="row" gap={4}>
                                                            <slotContext.theme.icons.DropRestrict color="warning" />
                                                            {t("drop", "Drop")}
                                                        </Stack>;
                                                    }
                                                    else if (value?.action === "revoke_grant_option") {
                                                        return <Stack direction="row" gap={4}>
                                                            <slotContext.theme.icons.DropCascade color="error" />
                                                            {t("drop-cascade", "Drop Cascade")}
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
                                        actions: [],
                                        autoSaveId: `role-cleanup-privs-grid-${session.profile.sch_id}`,
                                        statuses: ["data-rows"],
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

                                            const key = objectDllsKey(selectedPrivilege.objtype, selectedPrivilege.schema || null, selectedPrivilege.name);
                                            if (objectDlls[key]) {
                                                return objectDlls[key];
                                            }

                                            return `-- DDL preview not available for privileges --`;
                                        },
                                    }
                                },
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