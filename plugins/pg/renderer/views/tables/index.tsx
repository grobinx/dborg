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
import { SQL_EDITOR_EXECUTE_QUERY } from "@renderer/containers/Connections/ConnectionView/SqlEditorPanel";
import { SelectSchemaGroup } from "../../actions/SelectSchemaGroup";
import columnsTab from "./columnsTab";
import indexesTab from "./indexesTab";
import constraintsTab from "./constraintsTab";
import ddlTab from "./ddlTab";
import relationsTab from "./relationsTab";
import triggersTab from "./triggersTab";
import storageTab from "./storageTab";
import statisticsTab from "./statisticsTab";
import rlsPoliciesTab from "./rlsPoliciesTab";
import aclTab from "./aclTab";
import columnStatsTab from "./columnStatsTab";
import partitionsTab from "./partitionsTab";
import rulesTab from "./rulesTab";
import sequencesTab from "./sequencesTab";
import bloatTab from "./bloatTab";
import ioStatsTab from "./ioStatsTab";
import locksTab from "./locksTab";
import publicationsTab from "./publicationsTab";
import fdwTab from "./fdwTab";
import queryPlansTab from "./queryPlansTab";

interface TableRecord {
    schema_name: string;
    table_name: string;
    owner_name: string;
    table_type: string;
    description: string;
}

export function tablesView(session: IDatabaseSession): ConnectionView {
    const t = i18next.t.bind(i18next);

    let description: string | null = null;
    let selectedSchemaName: string | null = null;
    let rowSchemaName: string | null = null;
    let rowTableName: string | null = null;

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
                    actions: [
                        RefreshGridAction_ID,
                        SearchData_ID,
                        SelectSchemaAction_ID,
                    ],
                    actionSlotId: cid("tables-grid"),
                } as ITitleSlot,
                main: {
                    id: cid("tables-grid"),
                    type: "grid",
                    mode: "defined",
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
                    onRowClick: (row: TableRecord | undefined, refresh: RefreshSlotFunction) => {
                        if (row) {
                            description = row.description;
                            rowSchemaName = row.schema_name;
                            rowTableName = row.table_name;
                        }
                        else {
                            description = null;
                            rowSchemaName = null;
                            rowTableName = null;
                        }
                        refresh(cid("tables-text"));
                        refresh(cid("tables-title"));
                        refresh(cid("table-tab-label"));
                        refresh(cid("columns-tab-content"));
                        refresh(cid("indexes-tab-content"));
                        refresh(cid("constraints-tab-content"));
                        refresh(cid("ddl-tab-content"));
                        refresh(cid("relations-tab-content"));
                        refresh(cid("triggers-tab-content"));
                        refresh(cid("storage-tab-content"));
                        refresh(cid("statistics-tab-content"));
                        refresh(cid("rls-policies-tab-content"));
                        refresh(cid("acl-tab-content"));
                        refresh(cid("column-stats-tab-content"));
                        refresh(cid("partitions-tab-content"));
                        refresh(cid("rules-tab-content"));
                        refresh(cid("sequences-tab-content"));
                        refresh(cid("bloat-tab-content"));
                        refresh(cid("io-stats-tab-content"));
                        refresh(cid("locks-tab-content"));
                        refresh(cid("publications-tab-content"));
                        refresh(cid("fdw-tab-content"));
                        refresh(cid("query-plans-tab-content"));
                    },
                    actions: [
                        SelectSchemaAction(),
                        ShowRelationDataAction(context => {
                            const record = context.getData();
                            if (record) {
                                sendMessage(SQL_EDITOR_EXECUTE_QUERY, {
                                    to: session.info.uniqueId,
                                    from: cid("tables-grid"),
                                    query: `select * from "${record.schema_name}"."${record.table_name}"`,
                                });
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
                        return description ? description : "No description.";
                    },
                } as ITextSlot
            },
            editors: [
                {
                    id: cid("table-editors-tab"),
                    type: "tab",
                    closable: false,
                    label: {
                        id: cid("table-tab-label"),
                        type: "tablabel",
                        label: () => rowTableName ? `${rowSchemaName}.${rowTableName}` : t("not-selected", "Not selected"),
                        icon: "DatabaseTables",
                    },
                    content: {
                        id: cid("table-tab-content"),
                        type: "tabcontent",
                        content: {
                            id: cid("table-columns-tabs"),
                            type: "tabs",
                            tabs: [
                                columnsTab(session, () => rowSchemaName, () => rowTableName),
                                indexesTab(session, () => rowSchemaName, () => rowTableName),
                                constraintsTab(session, () => rowSchemaName, () => rowTableName),
                                relationsTab(session, () => rowSchemaName, () => rowTableName),
                                triggersTab(session, () => rowSchemaName, () => rowTableName),
                                storageTab(session, () => rowSchemaName, () => rowTableName),
                                statisticsTab(session, () => rowSchemaName, () => rowTableName),
                                ddlTab(session, () => rowSchemaName, () => rowTableName),
                                rlsPoliciesTab(session, () => rowSchemaName, () => rowTableName),
                                aclTab(session, () => rowSchemaName, () => rowTableName),
                                columnStatsTab(session, () => rowSchemaName, () => rowTableName),
                                partitionsTab(session, () => rowSchemaName, () => rowTableName),
                                rulesTab(session, () => rowSchemaName, () => rowTableName),
                                sequencesTab(session, () => rowSchemaName, () => rowTableName),
                                bloatTab(session, () => rowSchemaName, () => rowTableName),
                                ioStatsTab(session, () => rowSchemaName, () => rowTableName),
                                locksTab(session, () => rowSchemaName, () => rowTableName),
                                publicationsTab(session, () => rowSchemaName, () => rowTableName),
                                fdwTab(session, () => rowSchemaName, () => rowTableName),
                                queryPlansTab(session, () => rowSchemaName, () => rowTableName),
                            ],
                        }
                    },
                    // actions: [
                    //     ShowRelationDataAction_ID
                    // ],
                    // actionSlotId: "tables-grid-" + session.info.uniqueId
                }
            ]
        }
    };
}
