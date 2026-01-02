import React from "react";
import i18next from "i18next";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { IEditorSlot, IGridSlot, ITabSlot } from "../../../../manager/renderer/CustomSlots";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { SearchData_ID } from "@renderer/components/DataGrid/actions";
import { listOwnedObjects, listPrivileges, buildCleanupSql, OwnedObject, PrivilegeRecord } from "./roleAudit";
import { versionToNumber } from "../../../../../src/api/version";

const roleCleanupTab = (session: IDatabaseSession): ITabSlot => {
    const t = i18next.t.bind(i18next);
    const cid = (id: string) => `${id}-${session.info.uniqueId}`;
    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");

    let selectedRole: string | null = 'lkaminski';
    let targetOwner: string | null = null;

    let ownedCache: OwnedObject[] = [];
    let privsCache: PrivilegeRecord[] = [];

    return {
        id: cid("role-cleanup-tab"),
        type: "tab",
        label: {
            id: cid("role-cleanup-tab-label"),
            type: "tablabel",
            label: t("role-cleanup", "Role Cleanup"),
            icon: "ShieldUser"
        },
        content: {
            id: cid("role-cleanup-tab-content"),
            type: "tabcontent",
            content: (refresh) => ({
                id: cid("role-cleanup-content"),
                type: "content",
                title: {
                    id: cid("role-cleanup-title"),
                    type: "title",
                    title: t("role-cleanup-title-for-role", "Role Cleanup Tool: {{role}}", { role: selectedRole || t("none", "None") }),
                },
                main: {
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
                                        ] as ColumnDefinition[],
                                        autoSaveId: `role-cleanup-owned-grid-${session.profile.sch_id}`,
                                        statuses: ["data-rows"],
                                    } as IGridSlot
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
                            const sql = buildCleanupSql(ownedCache, privsCache, {
                                roleName: selectedRole,
                                newOwner: targetOwner ?? "",
                                ownedChoices: {},
                                privilegeChoices: {},
                            });
                            
                            return sql;
                        },
                    } as IEditorSlot,
                },
            }),
        },
        toolBar: {
            id: cid("role-cleanup-tab-toolbar"),
            type: "toolbar",
            tools: () => [
                SearchData_ID,
            ],
            actionSlotId: cid("role-owned-grid"),
        },
    };
};

export default roleCleanupTab;