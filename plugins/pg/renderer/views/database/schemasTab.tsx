import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, IPinnableTabSlot } from "../../../../manager/renderer/CustomSlots";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { icons } from "@renderer/themes/ThemeWrapper";
import { versionToNumber } from "../../../../../src/api/version";
import { schemaDdl } from "../../../common/ddls/schema";
import { DataGridChangesManager } from "@renderer/components/DataGrid/DataGridChangesManager";
import { executeScriptAction } from "../actions/ExecuteScript";
import { AclEntry, ALL_PRIVILEGES, mergeRecordsAcl } from "../../../common/acl";
import { diffDataGridRecords } from "@renderer/components/DataGrid/DataGridUtils";

export interface SchemaRecord {
    id: number;
    schema_name: string;
    schema_owner: string;
    schema_size: string;
    schema_size_bytes: number;
    created_at: string | null;
    tables_count: number | null;
    views_count: number | null;
    functions_count: number | null;
    sequences_count: number | null;
    types_count: number | null;
    total_objects: number | null;
    comment: string | null;
    is_system: boolean;
    acl: AclEntry[];
    security_labels: SchemaSecurityLabelEntry[];
    [key: string]: any;
}

export interface SchemaSecurityLabelEntry {
    provider: string;
    label: string;
    [key: string]: any;
}

export interface SchemaStatsRecord {
    tables_count: number;
    views_count: number;
    functions_count: number;
    sequences_count: number;
    types_count: number;
    total_objects: number;
    schema_size: string;
    schema_size_bytes: number;
    [key: string]: any;
}

export function schemasTab(session: IDatabaseSession): IPinnableTabSlot {
    const t = i18next.t.bind(i18next);

    let selectedRow: SchemaRecord | null = null;
    let allRows: SchemaRecord[] = [];
    const loadingStatsRow: SchemaRecord[] = [];
    let loadingStats: boolean = false;
    let loadingProgress: number | null = null;
    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");

    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    let roleNameList: string[] | null = null;
    const loadRoleNameList = async () => {
        if (roleNameList === null) {
            try {
                const { rows } = await session.query<{ rolname: string }>(
                    "select rolname from pg_roles union all select 'PUBLIC' order by rolname");
                roleNameList = rows.map(r => r.rolname);
            } catch (e) {
                roleNameList = [];
            }
        }
        return roleNameList;
    };
    loadRoleNameList();

    let currentUser: string | null = null;
    const loadCurrentUser = async () => {
        if (currentUser === null) {
            try {
                const { rows } = await session.query<{ current_user: string }>(
                    `select current_user`);
                currentUser = rows[0]?.current_user ?? null;
            } catch (e) {
                currentUser = null;
            }
        }
        return currentUser;
    };
    loadCurrentUser();

    const changes = session.createChangeManager<SchemaRecord>({
        context: { list: "schemas" },
        getUniqueId: (record) => record.id,
        generateScript: (change, row) => {
            function generateACLScript(changedAcl: AclEntry[], oryginalRow: Partial<SchemaRecord>): string {
                const script: string[] = [];
                const changedACL = diffDataGridRecords(oryginalRow?.acl ?? [], changedAcl, "id");

                for (const change of changedACL) {
                    const originalEntry = oryginalRow?.acl?.find(acl => acl.id === change.uniqueId);
                    if (change.type === "add") {
                        script.push(`GRANT ${change.data.privilege_type} ON SCHEMA ${oryginalRow.schema_name} TO ${change.data.grantee}${change.data.is_grantable ? " WITH GRANT OPTION" : ""};`);
                    } else if (change.type === "update") {
                        script.push(`REVOKE ${originalEntry?.privilege_type} ON SCHEMA ${oryginalRow.schema_name} FROM ${originalEntry?.grantee}${originalEntry?.is_grantable ? " CASCADE" : ""};`);
                        script.push(`GRANT ${change.data.privilege_type ?? originalEntry?.privilege_type} ON SCHEMA ${oryginalRow.schema_name} TO ${change.data.grantee ?? originalEntry?.grantee}${(change.data.is_grantable ?? originalEntry?.is_grantable) ? " WITH GRANT OPTION" : ""};`);
                    } else if (change.type === "remove") {
                        script.push(`REVOKE ${originalEntry?.privilege_type} ON SCHEMA ${oryginalRow.schema_name} FROM ${originalEntry?.grantee}${originalEntry?.is_grantable ? " CASCADE" : ""};`);
                    }
                }

                return script.join('\n');
            }

            const scripts: string[] = [];

            if (change.type === 'add') {
                // CREATE SCHEMA
                const schemaName = change.data.schema_name;
                const owner = change.data.schema_owner;
                const comment = change.data.comment;

                scripts.push(`-- Create new schema: ${schemaName}`);
                scripts.push(`CREATE SCHEMA IF NOT EXISTS ${schemaName} AUTHORIZATION ${owner};`);

                if (comment) {
                    const escapedComment = comment.replace(/'/g, "''");
                    scripts.push(`COMMENT ON SCHEMA ${schemaName} IS '${escapedComment}';`);
                }
                scripts.push("");

                for (const acl of change.data.acl || []) {
                    scripts.push(`GRANT ${acl.privilege_type} ON SCHEMA ${schemaName} TO ${acl.grantee}${acl.is_grantable ? " WITH GRANT OPTION" : ""};`);
                }
            } else if (change.type === 'update' && row) {
                // ALTER SCHEMA
                const oldName = row.schema_name;
                const newName = change.data.schema_name;
                const newOwner = change.data.schema_owner;
                const newComment = change.data.comment;

                scripts.push(`-- Update schema: ${oldName}`);

                if (newName && newName !== oldName) {
                    scripts.push(`ALTER SCHEMA ${oldName} RENAME TO ${newName};`);
                }

                if (newOwner && newOwner !== row.schema_owner) {
                    const targetName = newName || oldName;
                    scripts.push(`ALTER SCHEMA ${targetName} OWNER TO ${newOwner};`);
                }

                if (newComment !== undefined) {
                    const targetName = newName || oldName;
                    if (newComment) {
                        const escapedComment = newComment.replace(/'/g, "''");
                        scripts.push(`COMMENT ON SCHEMA ${targetName} IS '${escapedComment}';`);
                    } else {
                        scripts.push(`COMMENT ON SCHEMA ${targetName} IS NULL;`);
                    }
                }
                scripts.push("");

                const aclScript = generateACLScript(change.data.acl || [], row);
                if (aclScript) {
                    scripts.push(aclScript);
                }
            } else if (change.type === 'remove' && row) {
                // DROP SCHEMA
                const schemaName = row.schema_name;
                const cascade = change.userData?.cascade;

                scripts.push(`-- Drop schema: ${schemaName}`);
                scripts.push(`DROP SCHEMA IF EXISTS ${schemaName}${cascade ? ' CASCADE' : ''};`);
                scripts.push("");
            }

            return scripts.join('\n');
        }
    });

    const storeSchemasStats = () => {
        if (allRows.length === 0) return;

        const stats = allRows
            .filter(row => row.total_objects !== null)
            .map(row => ({
                schema_name: row.schema_name,
                tables_count: row.tables_count,
                views_count: row.views_count,
                functions_count: row.functions_count,
                sequences_count: row.sequences_count,
                types_count: row.types_count,
                total_objects: row.total_objects,
                schema_size: row.schema_size,
                schema_size_bytes: row.schema_size_bytes,
            }));

        session.storeProfileSettings("schemas-stats", {
            stats: stats,
        })
    }

    const restoreSchemasStats = async () => {
        if (allRows.length === 0) return;

        const settings = await session.getProfileSettings("schemas-stats");
        if (settings && settings.stats) {
            for (const stat of settings.stats) {
                const row = allRows.find((r) => r.schema_name === stat.schema_name);
                if (row) {
                    row.tables_count = stat.tables_count;
                    row.views_count = stat.views_count;
                    row.functions_count = stat.functions_count;
                    row.sequences_count = stat.sequences_count;
                    row.types_count = stat.types_count;
                    row.total_objects = stat.total_objects;
                    row.schema_size = stat.schema_size;
                    row.schema_size_bytes = stat.schema_size_bytes;
                }
            }
        }
    }

    async function getSchemaStats(schemaName: string): Promise<SchemaStatsRecord> {
        const sql = `
select
    coalesce(oc.tables_count, 0)::int as tables_count,
    coalesce(oc.views_count, 0)::int as views_count,
    coalesce(fc.functions_count, 0)::int as functions_count,
    coalesce(oc.sequences_count, 0)::int as sequences_count,
    coalesce(tc.types_count, 0)::int as types_count,
    coalesce(oc.tables_count, 0) + coalesce(oc.views_count, 0) + 
    coalesce(fc.functions_count, 0) + coalesce(oc.sequences_count, 0) + 
    coalesce(tc.types_count, 0) as total_objects,
    pg_size_pretty(sum(pg_total_relation_size(c.oid))) as schema_size,
    sum(pg_total_relation_size(c.oid))::bigint as schema_size_bytes
from pg_namespace n
left join pg_class c on c.relnamespace = n.oid and c.relkind in ('r', 'i', 't', 'm', 'S')
left join (
    select
        n.nspname as schema_name,
        count(*) filter (where c.relkind in ('r', 'p', 'f')) as tables_count,
        count(*) filter (where c.relkind in ('v', 'm')) as views_count,
        count(*) filter (where c.relkind = 'S') as sequences_count
    from pg_namespace n
    left join pg_class c on c.relnamespace = n.oid
    where c.relkind in ('r', 'v', 'S', 'm', 'f', 'p')
    group by n.nspname
) oc on oc.schema_name = n.nspname
left join (
    select
        n.nspname as schema_name,
        count(*) as functions_count
    from pg_namespace n
    left join pg_proc p on p.pronamespace = n.oid
    group by n.nspname
) fc on fc.schema_name = n.nspname
left join (
    select
        n.nspname as schema_name,
        count(*) as types_count
    from pg_namespace n
    left join pg_type t on t.typnamespace = n.oid
    where t.typtype in ('c', 'e', 'd')
    group by n.nspname
) tc on tc.schema_name = n.nspname
where n.nspname = $1
group by n.nspname, oc.tables_count, oc.views_count, fc.functions_count, oc.sequences_count, tc.types_count;
`;

        const { rows } = await session.query<SchemaStatsRecord>(sql, [schemaName]);
        return rows[0] || {
            tables_count: 0,
            views_count: 0,
            functions_count: 0,
            sequences_count: 0,
            types_count: 0,
            total_objects: 0,
            schema_size: "0 bytes",
            schema_size_bytes: 0,
        };
    }

    const loadingStatsText = (value: any, row: SchemaRecord) => {
        if (loadingStatsRow.includes(row)) {
            const Icon = icons!.Loading;
            return <Icon />;
        }
        return value;
    };

    return {
        id: cid("schemas-editors-tab"),
        type: "tab",
        closable: false,
        label: {
            id: cid("schemas-tab-label"),
            type: "tablabel",
            label: t("database-schemas", "Schemas"),
            icon: "SelectDatabaseSchema",
        },
        content: (slotContext) => ({
            id: cid("schemas-tab-content"),
            type: "tabcontent",
            content: {
                id: cid("schemas-main-splitter"),
                type: "split",
                direction: "horizontal",
                autoSaveId: `schemas-main-splitter-${session.profile.sch_id}`,
                secondSize: 25,
                first: {
                    id: cid("schemas-editor-splitter"),
                    type: "split",
                    direction: "vertical",
                    autoSaveId: `schemas-editor-splitter-${session.profile.sch_id}`,
                    secondSize: 25,
                    first: {
                        id: cid("schemas-grid"),
                        type: "grid",
                        uniqueField: "id",
                        rows: async () => {
                            const sql = `
select
    n.oid as id,
    n.nspname as schema_name,
    pg_get_userbyid(n.nspowner) as schema_owner,
    null::text as schema_size,
    null::bigint as schema_size_bytes,
    null::timestamp as created_at,
    null::int as tables_count,
    null::int as views_count,
    null::int as functions_count,
    null::int as sequences_count,
    null::int as types_count,
    null::int as total_objects,
    d.description as comment,
    n.nspname in ('pg_catalog', 'information_schema', 'pg_toast') or 
    n.nspname like 'pg_temp%' or n.nspname like 'pg_toast_temp%' as is_system,
    coalesce(
        (
            select json_agg(row_to_json(a))
            from (
                select
                    pg_get_userbyid(grantor)||'|'||pg_get_userbyid(grantee)||'|'||privilege_type||'|'||is_grantable as id,
                    pg_get_userbyid(grantor) as grantor,
                    case when grantee = 0 then 'PUBLIC' else pg_get_userbyid(grantee) end as grantee,
                    privilege_type,
                    is_grantable
                from aclexplode(n.nspacl)
            ) a
        ),
        '[]'::json
    ) as acl,
    coalesce(
        (
            select json_agg(row_to_json(s))
            from (
                select
                    provider,
                    label
                from pg_seclabel
                where classoid = 'pg_namespace'::regclass
                  and objoid = n.oid
                order by provider
            ) s
        ),
        '[]'::json
    ) as security_labels
from pg_namespace n
left join pg_description d on d.objoid = n.oid and d.classoid = 'pg_namespace'::regclass
where n.nspname not like 'pg_toast%'
  and n.nspname not like 'pg_temp%';
`;
                            const { rows } = await session.query<SchemaRecord>(sql);
                            allRows = mergeRecordsAcl(rows, ALL_PRIVILEGES.SCHEMA);
                            changes.setRows(allRows);
                            await restoreSchemasStats();
                            return allRows;
                        },
                        columns: [
                            { key: "schema_name", label: t("schema-name", "Schema Name"), dataType: "string", width: 220, sortDirection: "asc", sortOrder: 2 },
                            { key: "schema_owner", label: t("schema-owner", "Owner"), dataType: "string", width: 160 },
                            { key: "is_system", label: t("is-system", "System"), dataType: "boolean", width: 50, formatter: (v: boolean) => v ? t("yes", "Yes") : "" },
                            { key: "schema_size", label: t("schema-size", "Size"), dataType: "size", width: 130, sortDirection: "desc", sortOrder: 1, formatter: loadingStatsText },
                            { key: "total_objects", label: t("total-objects", "Total Objects"), dataType: "number", width: 130, formatter: loadingStatsText },
                            { key: "tables_count", label: t("tables-count", "Tables"), dataType: "number", width: 100, formatter: loadingStatsText },
                            { key: "views_count", label: t("views-count", "Views"), dataType: "number", width: 100, formatter: loadingStatsText },
                            { key: "sequences_count", label: t("sequences-count", "Sequences"), dataType: "number", width: 100, formatter: loadingStatsText },
                            { key: "functions_count", label: t("functions-count", "Functions"), dataType: "number", width: 100, formatter: loadingStatsText },
                            { key: "types_count", label: t("types-count", "Types"), dataType: "number", width: 100, formatter: loadingStatsText },
                            { key: "comment", label: t("comment", "Comment"), dataType: "string", width: 360 },
                        ] as ColumnDefinition[],
                        onRowSelect: (row: SchemaRecord | undefined) => {
                            selectedRow = row ?? null;
                            if (changes.getChanges().length === 0) {
                                slotContext.refresh(cid("schemas-editor"));
                            }
                            slotContext.refresh(cid("schemas-details-acl-grid"));
                            slotContext.refresh(cid("schemas-details-sl-grid"));
                            slotContext.refresh(cid("schemas-toolbar"));
                        },
                        changes: () => changes.getChanges(),
                        actions: [
                            {
                                id: "schema-stats-refresh",
                                label: t("refresh-schema-stats", "Refresh Schema Stats"),
                                icon: "Reload",
                                keySequence: ["Space"],
                                contextMenuGroupId: "schema-stats",
                                contextMenuOrder: 1,
                                disabled: () => selectedRow === null || loadingStats,
                                run: async () => {
                                    if (selectedRow) {
                                        const row = selectedRow;
                                        loadingStats = true;
                                        loadingStatsRow.push(row);
                                        slotContext.refresh(cid("schemas-grid"), "only");
                                        slotContext.refresh(cid("schemas-stats-progress"));
                                        slotContext.refresh(cid("schemas-toolbar"));
                                        try {
                                            const stats = await getSchemaStats(row.schema_name);
                                            Object.assign(row, stats);
                                            storeSchemasStats();
                                        } finally {
                                            const index = loadingStatsRow.indexOf(row);
                                            if (index !== -1) {
                                                loadingStatsRow.splice(index, 1);
                                            }
                                            loadingStats = false;
                                            slotContext.refresh(cid("schemas-grid"), "compute");
                                            slotContext.refresh(cid("schemas-stats-progress"));
                                            slotContext.refresh(cid("schemas-toolbar"));
                                        }
                                    }
                                },
                            },
                            {
                                id: "schema-stats-refresh-all",
                                label: () => loadingStats ? t("cancel-refresh-schemas", "Cancel Refresh All Schema Stats") : t("refresh-schemas", "Refresh All Schema Stats"),
                                icon: () => loadingStats ? "ReloadStop" : "ReloadAll",
                                keySequence: ["Alt+Shift+Enter"],
                                contextMenuGroupId: "schema-stats",
                                contextMenuOrder: 2,
                                //disabled: () => loadingStats,
                                run: async () => {
                                    if (loadingStats) {
                                        loadingStats = false;
                                        return;
                                    }
                                    loadingStats = true;
                                    slotContext.refresh(cid("schemas-toolbar"));
                                    try {
                                        for (const [index, row] of allRows.entries()) {
                                            loadingProgress = Math.round(((index + 1) / allRows.length) * 100);
                                            loadingStatsRow.push(row);
                                            slotContext.refresh(cid("schemas-grid"), "only");
                                            slotContext.refresh(cid("schemas-stats-progress"));
                                            try {
                                                const stats = await getSchemaStats(row.schema_name);
                                                Object.assign(row, stats);
                                            } finally {
                                                const index = loadingStatsRow.indexOf(row);
                                                if (index !== -1) {
                                                    loadingStatsRow.splice(index, 1);
                                                }
                                                slotContext.refresh(cid("schemas-grid"), "only");
                                            }
                                            if (!loadingStats) {
                                                break;
                                            }
                                        };
                                        storeSchemasStats();
                                    }
                                    finally {
                                        loadingStats = false;
                                        loadingProgress = null;
                                        slotContext.refresh(cid("schemas-grid"), "compute");
                                        slotContext.refresh(cid("schemas-stats-progress"));
                                        slotContext.refresh(cid("schemas-toolbar"));
                                    }
                                }
                            },
                            {
                                id: "schema-create",
                                label: t("queue-create-schema", "Add change: Create Schema"),
                                icon: "AddRow",
                                keySequence: ["F2"],
                                contextMenuGroupId: "schema-operations",
                                contextMenuOrder: 1,
                                run: async () => {
                                    const result = await slotContext.openDialog(
                                        cid("schema-create-dialog"),
                                        {
                                            schema_owner: currentUser,
                                        }
                                    );
                                    if (result) {
                                        if (changes.addRecord({
                                            id: Date.now() * -1, // Temporary ID, should be replaced with real ID after saving to DB
                                            schema_name: result.schema_name,
                                            schema_owner: result.schema_owner,
                                            comment: !!result.schema_comment ? result.schema_comment : undefined,
                                        })) {
                                            slotContext.refresh(cid("schemas-grid"), "only");
                                            slotContext.refresh(cid("schemas-editor"));
                                            slotContext.refresh(cid("schemas-toolbar"));
                                            slotContext.refresh(cid("schemas-editor-title"));
                                        }
                                    }
                                },
                            },
                            {
                                id: "schema-edit",
                                label: t("queue-edit-schema", "Add change: Edit Schema"),
                                icon: "EditRow",
                                keySequence: ["F4"],
                                contextMenuGroupId: "schema-operations",
                                contextMenuOrder: 2,
                                disabled: () => selectedRow === null || selectedRow.is_system || changes.findChange(selectedRow)?.type === "remove",
                                run: async () => {
                                    if (selectedRow) {
                                        const updated = changes.findChange(selectedRow);

                                        const result = await slotContext.openDialog(
                                            cid("schema-edit-dialog"),
                                            {
                                                schema_name: updated?.data.schema_name ?? selectedRow.schema_name,
                                                schema_owner: updated?.data.schema_owner ?? selectedRow.schema_owner,
                                            }
                                        );
                                        if (result) {
                                            if (changes.updateRecord(selectedRow, {
                                                schema_name: result.schema_name,
                                                schema_owner: result.schema_owner,
                                            })) {
                                                slotContext.refresh(cid("schemas-grid"), "only");
                                                slotContext.refresh(cid("schemas-editor"));
                                                slotContext.refresh(cid("schemas-toolbar"));
                                                slotContext.refresh(cid("schemas-editor-title") );
                                            }
                                        }
                                    }
                                },
                            },
                            {
                                id: "schema-comment",
                                label: t("queue-comment-schema", "Add change: Change Comment"),
                                icon: "Comment",
                                keySequence: ["F3"],
                                contextMenuGroupId: "schema-operations",
                                contextMenuOrder: 3,
                                disabled: () => selectedRow === null || selectedRow.is_system || changes.findChange(selectedRow)?.type === "remove",
                                run: async () => {
                                    if (selectedRow) {
                                        const updated = changes.findChange(selectedRow);

                                        const result = await slotContext.openDialog(
                                            cid("schema-comment-dialog"),
                                            {
                                                schema_comment: updated?.data.comment ?? selectedRow.comment,
                                            }
                                        );
                                        if (result) {
                                            if (changes.updateRecord(selectedRow, {
                                                comment: result.schema_comment,
                                            })) {
                                                slotContext.refresh(cid("schemas-grid"), "only");
                                                slotContext.refresh(cid("schemas-editor"));
                                                slotContext.refresh(cid("schemas-toolbar"));
                                                slotContext.refresh(cid("schemas-editor-title") );
                                            }
                                        }
                                    }
                                },
                            },
                            {
                                id: "schema-drop",
                                label: t("queue-drop-schema", "Add change: Drop Schema"),
                                icon: "RemoveRow",
                                keySequence: ["Ctrl+Delete"],
                                contextMenuGroupId: "schema-operations",
                                contextMenuOrder: 4,
                                disabled: () => selectedRow === null || selectedRow.is_system,
                                run: async () => {
                                    if (selectedRow) {
                                        if (await slotContext.showConfirmDialog({
                                            title: t("confirm-drop-schema", "Add change: Drop Schema"),
                                            message: t("drop-schema-confirmation", "Are you sure you want to add change to drop schema \"{{schema_name}}\"?", { schema_name: selectedRow.schema_name }),
                                            severity: "warning",
                                        })) {
                                            changes.removeRecord(selectedRow!, { userData: { cascade: false }, icon: undefined });
                                            slotContext.refresh(cid("schemas-grid"), "only");
                                            slotContext.refresh(cid("schemas-editor"));
                                            slotContext.refresh(cid("schemas-toolbar"));
                                            slotContext.refresh(cid("schemas-editor-title"));
                                        }
                                    }
                                },
                            },
                            {
                                id: "schema-drop-cascade",
                                label: t("queue-drop-schema-cascade", "Add change: Drop Schema (Cascade)"),
                                icon: "DropCascade",
                                keySequence: ["Ctrl+Shift+Delete"],
                                contextMenuGroupId: "schema-operations",
                                contextMenuOrder: 5,
                                disabled: () => selectedRow === null || selectedRow.is_system,
                                run: async () => {
                                    if (selectedRow) {
                                        if (await slotContext.showConfirmDialog({
                                            title: t("confirm-drop-schema-cascade", "Add change: Drop Schema (Cascade)"),
                                            message: t("drop-schema-cascade-confirmation", "Are you sure you want to add change to drop schema \"{{schema_name}}\" and all its dependent objects?", { schema_name: selectedRow.schema_name }),
                                            severity: "warning",
                                        })) {
                                            changes.removeRecord(selectedRow!, { userData: { cascade: true }, icon: "DropCascade" });
                                            slotContext.refresh(cid("schemas-grid"), "only");
                                            slotContext.refresh(cid("schemas-editor"));
                                            slotContext.refresh(cid("schemas-toolbar"));
                                            slotContext.refresh(cid("schemas-editor-title") );
                                        }
                                    }
                                },
                            },
                            {
                                id: "schema-rollback",
                                label: t("rollback-schema-changes", "Rollback Schema Changes"),
                                icon: "Rollback",
                                keySequence: ["Ctrl+Z"],
                                contextMenuGroupId: "schema-operations",
                                contextMenuOrder: 6,
                                disabled: () => !selectedRow || changes.findChange(selectedRow) === undefined,
                                run: async () => {
                                    if (selectedRow) {
                                        changes.cancelChanges(selectedRow);
                                        slotContext.refresh(cid("schemas-grid"), "only");
                                        slotContext.refresh(cid("schemas-editor"));
                                        slotContext.refresh(cid("schemas-toolbar"));
                                        slotContext.refresh(cid("schemas-editor-title") );
                                    }
                                },
                            },
                            {
                                id: "schema-rollback-all",
                                label: t("rollback-all-schema-changes", "Rollback All Schema Changes"),
                                icon: "Reset",
                                keySequence: ["Ctrl+Shift+Z"],
                                contextMenuGroupId: "schema-operations",
                                contextMenuOrder: 7,
                                disabled: () => !selectedRow || changes.getChanges().length === 0,
                                run: async () => {
                                    if (selectedRow) {
                                        changes.clearChanges();
                                        slotContext.refresh(cid("schemas-grid"), "only");
                                        slotContext.refresh(cid("schemas-editor"));
                                        slotContext.refresh(cid("schemas-toolbar"));
                                        slotContext.refresh(cid("schemas-editor-title") );
                                    }
                                },
                            },
                            {
                                id: "schema-acl",
                                label: t("queue-schema-acl", "Add change: Schema Access Control List"),
                                icon: <slotContext.theme.icons.AccessControl color="secondary" />,
                                keySequence: ["Shift+F4"],
                                contextMenuGroupId: "schema-operations",
                                contextMenuOrder: 5,
                                disabled: () => selectedRow === null,
                                run: async () => {
                                    if (selectedRow) {
                                        const updated = changes.findChange(selectedRow);

                                        const result = await slotContext.openDialog(
                                            cid("schema-acl-dialog"),
                                            {
                                                acl: updated?.data.acl ?? selectedRow.acl,
                                            }
                                        );

                                        if (result) {
                                            if (changes.updateRecord(selectedRow, {
                                                acl: result.acl,
                                            })) {
                                                slotContext.refresh(cid("schemas-grid"), "only");
                                                slotContext.refresh(cid("schemas-editor"));
                                                slotContext.refresh(cid("schemas-toolbar"));
                                                slotContext.refresh(cid("schemas-editor-title") );
                                            }
                                        }
                                    }
                                }
                            }
                        ],
                        autoSaveId: `schemas-grid-${session.profile.sch_id}`,
                        statuses: ["data-rows"],
                        progress: {
                            id: cid("schemas-stats-progress"),
                            type: "progress",
                            display: () => loadingStats,
                            value: () => loadingProgress,
                        },
                    } as IGridSlot,
                    second: {
                        type: "column",
                        items: [
                            {
                                id: cid("schemas-editor-title"),
                                type: "title",
                                title: () => {
                                    const count = changes.getChanges().length;
                                    return count > 0
                                        ? t("queued-changes-info", "Draft mode: {{count}} queued change(s). Nothing is executed until you run the SQL script.", { count })
                                        : t("no-queued-changes-info", "You can edit and execute the script below.");
                                },
                                toolBar: {
                                    type: "toolbar",
                                    tools: [
                                        "execute-script"
                                    ],
                                    actionSlotId: cid("schemas-editor"),
                                }
                            },
                            {
                                id: cid("schemas-editor"),
                                type: "editor",
                                lineNumbers: false,
                                readOnly: false,
                                miniMap: false,
                                content: async () => {
                                    const allChanges = changes.getChanges();

                                    if (allChanges.length > 0) {
                                        return changes.generateScript(
                                            t("schema-changes-script-header", "-- SQL Script for Schema Changes") + "\n"
                                        ) ?? "";
                                    }

                                    if (!selectedRow) return "-- No schema selected";
                                    return schemaDdl(session, selectedRow.schema_name);
                                },
                                actions: [
                                    executeScriptAction(session, slotContext, () => {
                                        slotContext.refresh(cid("schemas-grid"), "full");
                                        changes.clearChanges();
                                    }),
                                ],
                            },
                        ],
                    },
                },
                second: {
                    type: "split",
                    direction: "vertical",
                    autoSaveId: `schemas-details-bottom-splitter-${session.profile.sch_id}`,
                    secondSize: 50,
                    first: {
                        id: cid("schemas-details-acl-content"),
                        type: "content",
                        title: {
                            id: cid("schemas-details-acl-title"),
                            type: "title",
                            title: t("schema-acl", "Schema Access Control List"),
                        },
                        main: {
                            id: cid("schemas-details-acl-grid"),
                            type: "grid",
                            rows: async () => {
                                if (!selectedRow) return [];
                                return (selectedRow.acl || []) as AclEntry[];
                            },
                            columns: [
                                { key: "grantor", label: t("grantor", "Grantor"), dataType: "string", width: 100 },
                                { key: "grantee", label: t("grantee", "Grantee"), dataType: "string", width: 100 },
                                { key: "privilege_type", label: t("privilege-type", "Privilege Type"), dataType: "string", width: 100 },
                                { key: "is_grantable", label: t("is-grantable", "Is Grantable"), dataType: "boolean", width: 50 },
                            ] as ColumnDefinition[],
                            uniqueField: "id",
                            changes: () => diffDataGridRecords(selectedRow?.acl || [], changes.findChange(selectedRow)?.data.acl, "id"),
                            autoSaveId: `schemas-details-acl-grid-${session.profile.sch_id}`,
                        },
                        dialogs: [

                        ]
                    },
                    second: {
                        id: cid("schemas-details-sl-content"),
                        type: "content",
                        title: {
                            id: cid("schemas-details-sl-title"),
                            type: "title",
                            title: t("security-labels", "Security Labels"),
                        },
                        main: {
                            id: cid("schemas-details-sl-grid"),
                            type: "grid",
                            rows: async () => {
                                if (!selectedRow) return [];
                                return (selectedRow.security_labels || []) as SchemaSecurityLabelEntry[];
                            },
                            columns: [
                                { key: "provider", label: t("provider", "Provider"), dataType: "string", width: 160 },
                                { key: "label", label: t("label", "Label"), dataType: "string", width: 420 },
                            ] as ColumnDefinition[],
                            autoSaveId: `schemas-details-sl-grid-${session.profile.sch_id}`,
                        },
                        dialogs: [

                        ]
                    }
                },
            },
            dialogs: [
                {
                    id: cid("schema-create-dialog"),
                    type: "dialog",
                    title: t("create-schema", "Add change: Create Schema"),
                    items: [
                        {
                            type: "text",
                            key: "schema_name",
                            label: t("schema-name", "Schema Name"),
                            required: true,
                        },
                        {
                            type: "select",
                            key: "schema_owner",
                            label: t("schema-owner", "Owner"),
                            required: true,
                            options: () => {
                                return roleNameList!.map(role => ({ label: role, value: role }));
                            }
                        },
                        {
                            type: "textarea",
                            key: "schema_comment",
                            label: t("schema-comment", "Schema Comment"),
                        },
                    ],
                    onValidate: (values: Record<string, any>) => {
                        const newName = (values.schema_name || "").trim();

                        if (newName && newName !== selectedRow?.schema_name) {
                            if (allRows.some(row => row.schema_name === newName)) {
                                return t("schema-name-already-exists", "Schema with this name already exists");
                            }
                        }

                        return undefined;
                    },
                },
                {
                    id: cid("schema-edit-dialog"),
                    type: "dialog",
                    title: t("edit-schema", "Add change: Edit Schema"),
                    items: [
                        {
                            type: "text",
                            key: "schema_name",
                            label: t("change-schema-name", "Change Schema Name"),
                        },
                        {
                            type: "select",
                            key: "schema_owner",
                            label: t("change-schema-owner", "Change Owner"),
                            options: () => {
                                return roleNameList!.map(role => ({ label: role, value: role }));
                            }
                        }
                    ],
                    onValidate: (values: Record<string, any>) => {
                        const newName = (values.schema_name || "").trim();

                        if (newName && newName !== selectedRow?.schema_name) {
                            if (allRows.some(row => row.schema_name === newName)) {
                                return t("schema-name-already-exists", "Schema with this name already exists");
                            }
                        }

                        return undefined;
                    },
                },
                {
                    id: cid("schema-comment-dialog"),
                    type: "dialog",
                    title: t("edit-comment", "Add change: Edit Comment"),
                    items: [
                        {
                            type: "textarea",
                            key: "schema_comment",
                            label: t("change-schema-comment", "Change Schema Comment"),
                        },
                    ],
                },
                {
                    id: cid("schema-acl-dialog"),
                    type: "dialog",
                    title: t("edit-acl", "Add change: Edit Access Control List"),
                    items: [
                        {
                            type: "list",
                            key: "acl",
                            label: t("schema-acl", "Schema Access Control List"),
                            height: 200,
                            items: [
                                {
                                    type: "row",
                                    items: [
                                        {
                                            type: "text",
                                            key: "grantor",
                                            label: t("grantor", "Grantor"),
                                            disabled: true,
                                        },
                                        {
                                            type: "select",
                                            key: "grantee",
                                            label: t("grantee", "Grantee"),
                                            required: true,
                                            options: () => {
                                                return roleNameList!.map(role => ({ label: role, value: role }));
                                            },
                                            size: 4,
                                        },
                                        {
                                            type: "select",
                                            key: "privilege_type",
                                            label: t("privilege-type", "Privilege Type"),
                                            required: true,
                                            options: [
                                                { label: "USAGE", value: "USAGE" },
                                                { label: "CREATE", value: "CREATE" },
                                                { label: "ALL", value: "ALL" },
                                            ]
                                        },
                                        {
                                            type: "boolean",
                                            key: "is_grantable",
                                            label: t("is-admin", "Is Admin"),
                                        },
                                    ]
                                }
                            ],
                            prepareItem: () => {
                                return {
                                    id: `new-${Date.now() * -1}`,
                                    grantor: currentUser,
                                    privilege_type: "USAGE",
                                };
                            }
                        }
                    ],
                }
            ],
        }),
        toolBar: [
            {
                id: cid("schemas-toolbar"),
                type: "toolbar",
                tools: [
                    ["schema-create", "schema-edit", "schema-comment", "schema-acl"],
                    ["schema-drop", "schema-drop-cascade"],
                    ["schema-rollback", "schema-rollback-all"],
                    ["schema-stats-refresh", "schema-stats-refresh-all"]
                ],
                actionSlotId: cid("schemas-grid"),
            }
        ],
    };
}
