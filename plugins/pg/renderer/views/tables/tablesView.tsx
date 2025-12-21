import { SearchData_ID } from "@renderer/components/DataGrid/actions";
import { RefreshGridAction_ID } from "@renderer/containers/ViewSlots/actions/RefreshGridAction";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { ConnectionView } from "plugins/manager/renderer/Plugin";
import { SelectSchemaAction, SelectSchemaAction_ID } from "../../actions/SelectSchemaAction";
import { IGridSlot, ITextSlot, ITitleSlot } from "plugins/manager/renderer/CustomSlots";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { RefreshSlotFunction } from "@renderer/containers/ViewSlots/RefreshSlotContext";
import { ShowRelationDataAction } from "../../actions/ShowRelationData";
import { sendMessage } from "@renderer/contexts/MessageContext";
import { SQL_EDITOR_EXECUTE_QUERY, SqlEditorExecuteQueryMessage } from "@renderer/containers/Connections/ConnectionView/SqlEditorPanel";
import { SelectSchemaGroup } from "../../actions/SelectSchemaGroup";
import { tableView } from "./tableView";

export interface TableRecord {
    schema_name: string;
    table_name: string;
    owner_name: string;
    table_type: "foreign" | "partitioned" | "regular" | null;
    description: string;
}

export function tablesView(session: IDatabaseSession): ConnectionView {
    const t = i18next.t.bind(i18next);

    let selectedSchemaName: string | null = null;
    let selectedRow: TableRecord | null = null;

    const setSelectedSchemaName = async () => {
        const { rows } = await session.query<{ schema_name: string }>('select current_schema() as schema_name');
        selectedSchemaName = rows[0]?.schema_name ?? null;
    }
    setSelectedSchemaName();

    const cid = (id: string) => {
        return `${id}-${session.info.uniqueId}`;
    }

    return {
        type: "connection",
        id: cid("tables-view"),
        icon: "DatabaseTables",
        label: t("database-tables", "Tables"),
        slot: {
            id: cid("tables-slot"),
            type: "integrated",
            side: {
                id: cid("tables-side"),
                type: "content",
                title: {
                    id: cid("tables-title"),
                    type: "title",
                    icon: "DatabaseTables",
                    title: () => t("pg-tables-with-schema", "Tables {{schemaName}}", { schemaName: selectedSchemaName }),
                    toolBar: {
                        id: cid("tables-title-toolbar"),
                        type: "toolbar",
                        tools: [
                            RefreshGridAction_ID,
                            SearchData_ID,
                            SelectSchemaAction_ID,
                        ],
                        actionSlotId: cid("tables-grid"),
                    },
                } as ITitleSlot,
                main: {
                    id: cid("tables-grid"),
                    type: "grid",
                    mode: "defined",
                    uniqueField: "table_name",
                    rows: async () => {
                        const { rows } = await session.query(`
                                        select 
                                            n.nspname as schema_name, c.relname as table_name, pg_get_userbyid(c.relowner) as owner_name, d.description,
                                            case c.relkind when 'r'::"char" then 'regular' when 'f'::"char" then 'foreign' when 'p'::"char" then 'partitioned' end table_type
                                        from 
                                            pg_class c
                                            left join pg_namespace n on n.oid = c.relnamespace
                                            left join pg_description d on d.classoid = 'pg_class'::regclass and d.objoid = c.oid and d.objsubid = 0
                                        where 
                                            c.relkind in ('r'::"char", 'f'::"char", 'p'::"char")
                                            and (n.nspname = $1 or (n.nspname = any (current_schemas(false)) and coalesce($1, current_schema()) = current_schema() and n.nspname <> 'public'))
                                        order by 
                                            schema_name, table_name`,
                            [selectedSchemaName]
                        );
                        return rows;
                    },
                    columns: [
                        {
                            label: "Table Name",
                            key: "table_name",
                            dataType: "string",
                            width: 170,
                        },
                        {
                            label: "Schema Name",
                            key: "schema_name",
                            dataType: "string",
                            width: 150,
                        },
                        {
                            label: "Owner Name",
                            key: "owner_name",
                            dataType: "string",
                            width: 120,
                        },
                        {
                            label: "Table Type",
                            key: "table_type",
                            dataType: "string",
                            width: 80,
                        },
                    ] as ColumnDefinition[],
                    onRowSelect: (row: TableRecord | undefined, refresh: RefreshSlotFunction) => {
                        selectedRow = row ? row : null;
                        refresh(cid("tables-text"));
                        refresh(cid("tables-title"));
                        refresh(cid("table-tab-label"));
                        refresh(cid("table-columns-tab-content"));
                        refresh(cid("table-indexes-tab-content"));
                        refresh(cid("table-constraints-tab-content"));
                        refresh(cid("table-ddl-tab-content"));
                        refresh(cid("table-relations-tab-content"));
                        refresh(cid("table-triggers-tab-content"));
                        refresh(cid("table-storage-tab-content"));
                        refresh(cid("table-statistics-tab-content"));
                        refresh(cid("table-rls-policies-tab-content"));
                        refresh(cid("table-acl-tab-content"));
                        refresh(cid("table-column-stats-tab-content"));
                        refresh(cid("table-partitions-tab-content"));
                        refresh(cid("table-rules-tab-content"));
                        refresh(cid("table-sequences-tab-content"));
                        refresh(cid("table-bloat-tab-content"));
                        refresh(cid("table-io-stats-tab-content"));
                        refresh(cid("table-locks-tab-content"));
                        refresh(cid("table-publications-tab-content"));
                        refresh(cid("table-fdw-tab-content"));
                        refresh(cid("table-query-plans-tab-content"));
                    },
                    actions: [
                        SelectSchemaAction(),
                        ShowRelationDataAction(context => {
                            const record = context.getData();
                            if (record) {
                                if (record.table_type !== "foreign") {
                                    sendMessage(SQL_EDITOR_EXECUTE_QUERY, {
                                        to: session.info.uniqueId,
                                        from: cid("tables-grid"),
                                        query: `select * from "${record.schema_name}"."${record.table_name}" tablesample system(10) limit 200`,
                                    } as SqlEditorExecuteQueryMessage);
                                } else {
                                    sendMessage(SQL_EDITOR_EXECUTE_QUERY, {
                                        to: session.info.uniqueId,
                                        from: cid("tables-grid"),
                                        query: `select * from "${record.schema_name}"."${record.table_name}" limit 200`,
                                    } as SqlEditorExecuteQueryMessage);
                                }
                            }
                        })
                    ],
                    actionGroups: (refresh: RefreshSlotFunction) => [
                        SelectSchemaGroup(session, selectedSchemaName, (schemaName: string) => {
                            selectedSchemaName = schemaName;
                            refresh(cid("tables-grid"));
                            refresh(cid("tables-title"));
                        }),
                    ],
                    autoSaveId: `tables-grid-${session.profile.sch_id}`,
                    status: ["data-rows"]
                } as IGridSlot,
                text: {
                    id: cid("tables-text"),
                    type: "text",
                    text: () => {
                        return selectedRow && selectedRow.description ? selectedRow.description : "No description.";
                    },
                } as ITextSlot
            },
            editors: [
                tableView(session, () => selectedRow, false)
            ]
        }
    };
}
