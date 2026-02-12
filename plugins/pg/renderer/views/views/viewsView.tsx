import { SearchData_ID } from "@renderer/components/DataGrid/actions";
import { RefreshGridAction_ID } from "@renderer/containers/ViewSlots/actions/RefreshGridAction";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { ConnectionView } from "plugins/manager/renderer/Plugin";
import { SelectSchemaAction, SelectSchemaAction_ID } from "../../actions/SelectSchemaAction";
import { IGridSlot, ITextSlot, ITitleSlot } from "plugins/manager/renderer/CustomSlots";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { RefreshSlotFunction } from "@renderer/containers/ViewSlots/ViewSlotContext";
import { SelectSchemaGroup } from "../../actions/SelectSchemaGroup";
import { ShowRelationDataAction } from "../../actions/ShowRelationData";
import { SQL_EDITOR_EXECUTE_QUERY, SqlEditorExecuteQueryMessage } from "@renderer/containers/Connections/ConnectionView/SqlEditorPanel";
import { sendMessage } from "@renderer/contexts/MessageContext";
import { viewView } from "./viewView";

export interface ViewRecord {
    schema_name: string;
    view_name: string;
    owner_name: string;
    view_type: "view" | "materialized" | null;
    description: string;
    [key: string]: any;
}

export function viewsView(session: IDatabaseSession): ConnectionView {
    const t = i18next.t.bind(i18next);

    let selectedSchemaName: string | null = null;
    let selectedRow: ViewRecord | null = null;

    const setSelectedSchemaName = async () => {
        const { rows } = await session.query<{ schema_name: string }>("select current_schema() as schema_name");
        selectedSchemaName = rows[0]?.schema_name ?? null;
    };
    setSelectedSchemaName();

    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    return {
        type: "connection",
        id: cid("views-view"),
        icon: "DatabaseViews",
        label: t("database-views", "Views"),
        slot: {
            id: cid("views-slot"),
            type: "integrated",
            side: {
                id: cid("views-side"),
                type: "content",
                title: {
                    id: cid("views-title"),
                    type: "title",
                    icon: "DatabaseViews",
                    title: () => t("pg-views-with-schema", "Views {{schemaName}}", { schemaName: selectedSchemaName }),
                    toolBar: {
                        id: cid("views-title-toolbar"),
                        type: "toolbar",
                        tools: [RefreshGridAction_ID, SearchData_ID, SelectSchemaAction_ID],
                        actionSlotId: cid("views-grid"),
                    },
                } as ITitleSlot,
                main: {
                    id: cid("views-grid"),
                    type: "grid",
                    uniqueField: "view_name",
                    rows: async () => {
                        const { rows } = await session.query<ViewRecord>(
                            `
              select 
                n.nspname as schema_name,
                c.relname as view_name,
                pg_get_userbyid(c.relowner) as owner_name,
                d.description,
                case c.relkind when 'v'::"char" then 'view' when 'm'::"char" then 'materialized' end as view_type
              from 
                pg_class c
                left join pg_namespace n on n.oid = c.relnamespace
                left join pg_description d on d.classoid = 'pg_class'::regclass and d.objoid = c.oid and d.objsubid = 0
              where 
                c.relkind in ('v'::"char", 'm'::"char")
                and (n.nspname = $1 or (n.nspname = any (current_schemas(false)) and coalesce($1, current_schema()) = current_schema() and n.nspname <> 'public'))
              order by 
                schema_name, view_name
              `,
                            [selectedSchemaName]
                        );
                        return rows;
                    },
                    columns: [
                        { label: "View Name", key: "view_name", dataType: "string", width: 170 },
                        { label: "Schema Name", key: "schema_name", dataType: "string", width: 150 },
                        { label: "Owner Name", key: "owner_name", dataType: "string", width: 120 },
                        { label: "View Type", key: "view_type", dataType: "string", width: 100 },
                    ] as ColumnDefinition[],
                    onRowSelect: (row: ViewRecord | undefined, slotContext) => {
                        selectedRow = row ?? null;
                        slotContext.refresh(cid("views-text"));
                        slotContext.refresh(cid("views-title"));
                        slotContext.refresh(cid("view-tab-label"));
                        slotContext.refresh(cid("view-columns-grid"));
                        slotContext.refresh(cid("view-ddl-editor"));
                        slotContext.refresh(cid("view-indexes-grid"));
                        slotContext.refresh(cid("view-constraints-grid"));
                        slotContext.refresh(cid("view-triggers-grid"));
                        slotContext.refresh(cid("view-rls-policies-grid"));
                        slotContext.refresh(cid("view-acl-grid"));
                        slotContext.refresh(cid("view-rules-grid"));
                        slotContext.refresh(cid("view-locks-grid"));
                        slotContext.refresh(cid("view-query-plans-grid"));
                        slotContext.refresh(cid("view-storage-grid"));
                        slotContext.refresh(cid("view-functions-grid"));
                        slotContext.refresh(cid("view-mat-refresh-grid"));
                    },
                    actions: [
                        SelectSchemaAction(),
                        ShowRelationDataAction(context => {
                            const record = context.getRowData();
                            if (record) {
                                sendMessage(SQL_EDITOR_EXECUTE_QUERY, {
                                    to: session.info.uniqueId,
                                    from: cid("views-grid"),
                                    query: `select * from "${record.schema_name}"."${record.view_name}" limit 200`,
                                } as SqlEditorExecuteQueryMessage);
                            }
                        })
                    ],
                    actionGroups: (slotContext) => [
                        SelectSchemaGroup(session, selectedSchemaName, (schemaName: string) => {
                            selectedSchemaName = schemaName;
                            slotContext.refresh(cid("views-grid"));
                            slotContext.refresh(cid("views-title"));
                        })
                    ],
                    autoSaveId: `views-grid-${session.profile.sch_id}`,
                    statuses: ["data-rows"],
                } as IGridSlot,
                text: {
                    id: cid("views-text"),
                    type: "text",
                    text: () => (selectedRow && selectedRow.description ? selectedRow.description : "No description."),
                } as ITextSlot,
            },
            editors: [
                viewView(session, () => selectedRow),
            ],
        },
    };
}