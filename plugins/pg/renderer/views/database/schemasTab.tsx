import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { IGridSlot, ITabSlot } from "../../../../manager/renderer/CustomSlots";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { icons } from "@renderer/themes/ThemeWrapper";
import { versionToNumber } from "../../../../../src/api/version";
import { schemaDdl } from "../../../common/ddls/schema";
import { DataGridChangeRow } from "@renderer/components/DataGrid/DataGrid";
import { useDataGridChanges } from "@renderer/components/DataGrid/useDataGridChanges";
import { DataGridChangesManager } from "@renderer/components/DataGrid/DataGridChangesManager";

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
    acl: SchemaAclEntry[];
    [key: string]: any;
}

export interface SchemaAclEntry {
    grantor: string;
    grantee: string;
    privilege_type: string;
    is_grantable: boolean;
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

export function schemasTab(session: IDatabaseSession): ITabSlot {
    const t = i18next.t.bind(i18next);

    let selectedRow: SchemaRecord | null = null;
    let selectedRowDetails: SchemaRecord | null = null;
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
                    `select rolname
                 from pg_roles
                 order by rolname`);
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

    const changes = new DataGridChangesManager<SchemaRecord>({
        getUniqueId: (record) => record.id,
    });

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

    function generateChangesScript(): string {
        const allChanges = changes.getChanges();

        if (allChanges.length === 0) {
            return "-- No changes";
        }

        const scripts: string[] = [];
        scripts.push("-- Schema Changes Script");
        scripts.push("-- Generated automatically from pending changes");
        scripts.push("");

        for (const change of allChanges) {
            const original = allRows.find(r => r.id === change.uniqueId);
            if (change.type === 'add') {
                // CREATE SCHEMA
                const schemaName = change.data.schema_name;
                const owner = change.data.schema_owner;
                const comment = change.data.comment;

                scripts.push(`-- Create new schema: ${schemaName}`);
                scripts.push(`CREATE SCHEMA ${schemaName} AUTHORIZATION ${owner};`);

                if (comment) {
                    const escapedComment = comment.replace(/'/g, "''");
                    scripts.push(`COMMENT ON SCHEMA ${schemaName} IS '${escapedComment}';`);
                }
                scripts.push("");
            } else if (change.type === 'update' && original) {
                // ALTER SCHEMA
                const oldName = original.schema_name;
                const newName = change.data.schema_name;
                const newOwner = change.data.schema_owner;
                const newComment = change.data.comment;

                scripts.push(`-- Update schema: ${oldName}`);

                if (newName && newName !== oldName) {
                    scripts.push(`ALTER SCHEMA ${oldName} RENAME TO ${newName};`);
                }

                if (newOwner && newOwner !== original.schema_owner) {
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
            } else if (change.type === 'remove' && original) {
                // DROP SCHEMA
                const schemaName = original.schema_name;
                const cascade = change.userData?.cascade;

                scripts.push(`-- Drop schema: ${schemaName}`);
                scripts.push(`DROP SCHEMA ${schemaName}${cascade ? ' CASCADE' : ''};`);
                scripts.push("");
            }
        }

        return scripts.join('\n');
    }

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
                    pg_get_userbyid(grantor) as grantor,
                    case when grantee = 0 then 'PUBLIC' else pg_get_userbyid(grantee) end as grantee,
                    privilege_type,
                    is_grantable
                from aclexplode(n.nspacl)
            ) a
        ),
        '[]'::json
    ) as acl
from pg_namespace n
left join pg_description d on d.objoid = n.oid and d.classoid = 'pg_namespace'::regclass
where n.nspname not like 'pg_toast%'
  and n.nspname not like 'pg_temp%';
`;
                            const { rows } = await session.query<SchemaRecord>(sql);
                            allRows = rows;
                            return rows;
                        },
                        columns: [
                            { key: "schema_name", label: t("schema-name", "Schema Name"), dataType: "string", width: 220, sortDirection: "asc", sortOrder: 2 },
                            { key: "schema_owner", label: t("schema-owner", "Owner"), dataType: "string", width: 160 },
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
                            if (selectedRow?.schema_name !== row?.schema_name) {
                                selectedRow = row ?? null;
                                selectedRowDetails = row ?? null;
                                if (changes.getChanges().length === 0) {
                                    slotContext.refresh(cid("schemas-editor"));
                                }
                                slotContext.refresh(cid("schemas-details-grid"));
                                slotContext.refresh(cid("schemas-details-acl-grid"));
                                slotContext.refresh(cid("schemas-toolbar"));
                            }
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
                                label: t("create-schema", "Create Schema"),
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
                                        }
                                    }
                                },
                            },
                            {
                                id: "schema-edit",
                                label: t("edit-schema", "Edit Schema"),
                                icon: "EditRow",
                                keySequence: ["F4"],
                                contextMenuGroupId: "schema-operations",
                                contextMenuOrder: 2,
                                disabled: () => selectedRow === null || selectedRow.is_system,
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
                                            }
                                        }
                                    }
                                },
                            },
                            {
                                id: "schema-drop",
                                label: t("drop-schema", "Drop Schema"),
                                icon: "RemoveRow",
                                keySequence: ["Ctrl+Delete"],
                                contextMenuGroupId: "schema-operations",
                                contextMenuOrder: 4,
                                disabled: () => selectedRow === null || selectedRow.is_system,
                                run: async () => {
                                    if (selectedRow) {
                                        const result = await slotContext.openDialog(
                                            cid("schema-drop-dialog"),
                                            {
                                                schema_name: selectedRow.schema_name,
                                            }
                                        );
                                    }
                                },
                            },
                            {
                                id: "schema-comment",
                                label: t("change-schema-comment", "Change Schema Comment"),
                                icon: "Comment",
                                keySequence: ["F3"],
                                contextMenuGroupId: "schema-operations",
                                contextMenuOrder: 3,
                                disabled: () => selectedRow === null || selectedRow.is_system,
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
                                            }
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
                                contextMenuOrder: 5,
                                disabled: () => !selectedRow || changes.findChange(selectedRow) === undefined,
                                run: async () => {
                                    if (selectedRow) {
                                        changes.cancelChanges(selectedRow);
                                        slotContext.refresh(cid("schemas-grid"), "only");
                                        slotContext.refresh(cid("schemas-editor"));
                                        slotContext.refresh(cid("schemas-toolbar"));
                                    }
                                },
                            },
                            {
                                id: "schema-rollback-all",
                                label: t("rollback-all-schema-changes", "Rollback All Schema Changes"),
                                icon: "Reset",
                                keySequence: ["Ctrl+Shift+Z"],
                                contextMenuGroupId: "schema-operations",
                                contextMenuOrder: 6,
                                disabled: () => !selectedRow || changes.getChanges().length === 0,
                                run: async () => {
                                    if (selectedRow) {
                                        changes.clearChanges();
                                        slotContext.refresh(cid("schemas-grid"), "only");
                                        slotContext.refresh(cid("schemas-editor"));
                                        slotContext.refresh(cid("schemas-toolbar"));
                                    }
                                },
                            },
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
                        id: cid("schemas-editor"),
                        type: "editor",
                        lineNumbers: false,
                        readOnly: false,
                        miniMap: false,
                        content: async () => {
                            const allChanges = changes.getChanges();

                            if (allChanges.length > 0) {
                                return generateChangesScript();
                            }

                            if (!selectedRow) return "-- No schema selected";
                            return schemaDdl(session, selectedRow.schema_name);
                        },
                    },
                },
                second: {
                    id: cid("schemas-details-splitter"),
                    type: "split",
                    direction: "vertical",
                    autoSaveId: `schemas-details-splitter-${session.profile.sch_id}`,
                    first: {
                        id: cid("schemas-details-grid"),
                        type: "grid",
                        pivot: true,
                        rows: async () => {
                            if (!selectedRow) return [];
                            selectedRowDetails = selectedRow;
                            return [selectedRow];
                        },
                        columns: [
                            { key: "schema_name", label: t("schema-name", "Schema Name"), dataType: "string", width: 220 },
                            { key: "schema_owner", label: t("schema-owner", "Owner"), dataType: "string", width: 160 },
                            { key: "schema_size", label: t("schema-size", "Size"), dataType: "size", width: 130 },
                            { key: "schema_size_bytes", label: t("schema-size-bytes", "Size (bytes)"), dataType: "number", width: 150 },
                            { key: "total_objects", label: t("total-objects", "Total Objects"), dataType: "number", width: 130 },
                            { key: "tables_count", label: t("tables-count", "Tables"), dataType: "number", width: 100 },
                            { key: "views_count", label: t("views-count", "Views"), dataType: "number", width: 100 },
                            { key: "sequences_count", label: t("sequences-count", "Sequences"), dataType: "number", width: 110 },
                            { key: "functions_count", label: t("functions-count", "Functions"), dataType: "number", width: 110 },
                            { key: "types_count", label: t("types-count", "Types"), dataType: "number", width: 100 },
                            { key: "comment", label: t("comment", "Comment"), dataType: "string", width: 360 },
                            { key: "is_system", label: t("is-system", "System"), dataType: "boolean", width: 100 },
                        ] as ColumnDefinition[],
                        pivotColumns: [
                            { key: "property", label: t("property", "Property"), dataType: "string", width: 200 },
                            { key: "value", label: t("value", "Value"), dataType: "string", width: 420 },
                        ] as ColumnDefinition[],
                        autoSaveId: `schemas-details-grid-${session.profile.sch_id}`,
                    },
                    second: {
                        id: cid("schemas-details-acl-content"),
                        type: "content",
                        title: {
                            id: cid("schemas-details-acl-title"),
                            type: "title",
                            title: t("schema-acl", "ACL"),
                        },
                        main: {
                            id: cid("schemas-details-acl-grid"),
                            type: "grid",
                            rows: async () => {
                                if (!selectedRowDetails) return [];
                                return (selectedRowDetails.acl || []) as SchemaAclEntry[];
                            },
                            columns: [
                                { key: "grantor", label: t("grantor", "Grantor"), dataType: "string", width: 100 },
                                { key: "grantee", label: t("grantee", "Grantee"), dataType: "string", width: 100 },
                                { key: "privilege_type", label: t("privilege-type", "Privilege Type"), dataType: "string", width: 100 },
                                { key: "is_grantable", label: t("is-grantable", "Is Grantable"), dataType: "boolean", width: 50 },
                            ] as ColumnDefinition[],
                            autoSaveId: `schemas-details-acl-grid-${session.profile.sch_id}`,
                        },
                    },
                },
            },
            dialogs: [
                {
                    id: cid("schema-create-dialog"),
                    type: "dialog",
                    title: t("create-schema", "Create Schema"),
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
                    title: t("edit-schema", "Edit Schema"),
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
                    title: t("edit-comment", "Edit Comment"),
                    items: [
                        {
                            type: "textarea",
                            key: "schema_comment",
                            label: t("change-schema-comment", "Change Schema Comment"),
                        },
                    ],
                },
                {
                    id: cid("schema-drop-dialog"),
                    type: "dialog",
                    title: t("drop-schema", "Drop Schema"),
                    items: [
                        {
                            type: "static",
                            text: (values) => t("drop-schema-confirmation", "Are you sure you want to drop schema \"{{schema_name}}\"?", { schema_name: values.schema_name }),
                        },
                    ],
                    labels: [
                        { id: "cancel", label: t("cancel", "Cancel"), color: "secondary" },
                        { id: "cascade", label: t("drop-cascade", "Cascade"), color: "error" },
                        { id: "drop", label: t("drop", "Drop"), color: "error" },
                    ],
                    onConfirm: (_, confirmId) => {
                        if (confirmId === "drop") {
                            changes.removeRecord(selectedRow!, { userData: { cascade: false }, icon: undefined });
                        } else if (confirmId === "cascade") {
                            changes.removeRecord(selectedRow!, { userData: { cascade: true }, icon: "DropCascade" });
                        }
                        slotContext.refresh(cid("schemas-grid"), "only");
                        slotContext.refresh(cid("schemas-editor"));
                        slotContext.refresh(cid("schemas-toolbar"));
                    },
                }
            ],
        }),
        toolBar: [
            {
                id: cid("schemas-toolbar"),
                type: "toolbar",
                tools: [
                    ["schema-create", "schema-edit", "schema-comment"],
                    ["schema-rollback", "schema-rollback-all"],
                    ["schema-drop"],
                    ["schema-stats-refresh", "schema-stats-refresh-all"]
                ],
                actionSlotId: cid("schemas-grid"),
            }
        ],
    };
}
