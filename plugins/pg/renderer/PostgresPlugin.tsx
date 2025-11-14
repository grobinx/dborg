import { Plugin } from "plugins/manager/renderer/Plugin";
import logo from "../resources/postgresql-logo.svg"; // Importing the PostgreSQL logo
import { IPluginContext } from "plugins/manager/renderer/Plugin";
import { DRIVER_UNIQUE_ID } from "../common/consts"; // Importing the unique ID for the PostgreSQL driver
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { SearchData_ID } from "@renderer/components/DataGrid/actions";
import { SelectSchemaAction, SelectSchemaAction_ID } from "./actions/SelectSchemaAction";
import { SelectSchemaGroup } from "./actions/SelectSchemaGroup";
import i18next from "i18next";
import { RefreshGridAction_ID } from "@renderer/containers/ViewSlots/actions/RefreshGridAction";
import { IGridSlot, ITextSlot, ITitleSlot } from "plugins/manager/renderer/CustomSlots";
import { RefreshSlotFunction } from "@renderer/containers/ViewSlots/RefreshSlotContext";
import tableColumnsTab from "./slots/tableColumnsSlot";
import tableIndexesTab from "./slots/tableIndexesSlot";
import { ShowRelationDataAction } from "./actions/ShowRelationData";
import { sendMessage } from "@renderer/contexts/MessageContext";
import { SQL_EDITOR_EXECUTE_QUERY } from "@renderer/containers/Connections/ConnectionView/SqlEditorPanel";
import { settingsGroupDefaults } from "@renderer/contexts/SettingsContext";

export const PLUGIN_ID = "orbada-postgres-plugin"; // Unique identifier for the plugin

const PostgresPlugin: Plugin = {
    id: PLUGIN_ID, // Unique identifier for the plugin
    name: "PostgreSQL Plugin for ORBADA", // Name of the plugin
    description: "A plugin to integrate PostgreSQL database functionality into ORBADA.", // Description of the plugin
    version: "1.0.0", // Version of the plugin
    categories: ["database"], // Categories the plugin belongs to
    icon: logo, // Icon for the plugin
    author: "Andrzej Kałuża", // Author of the plugin
    licenseType: "MIT", // License type of the plugin
    keywords: ["postgresql", "database"], // Keywords associated with the plugin

    initialize(context: IPluginContext): void {
        context.registerConnectionViewsFactory((session) => {
            if (session.info.driver.uniqueId !== DRIVER_UNIQUE_ID) {
                return null;
            }

            let description: string | null = null;
            let selectedSchemaName: string | null = null;
            let rowSchemaName: string | null = null;
            let rowTableName: string | null = null;
            const t = i18next.t.bind(i18next);

            const setSelectedSchemaName = async () => {
                const { rows } = await session.query<{ schema_name: string }>('select current_schema() as schema_name');
                selectedSchemaName = rows[0]?.schema_name ?? null;
            }
            setSelectedSchemaName();

            return [
                {
                    type: "connection",
                    id: "tables-view-" + session.info.uniqueId,
                    icon: "DatabaseTables",
                    label: t("database-tables", "Tables"),
                    slot: {
                        id: "tables-slot-" + session.info.uniqueId,
                        type: "integrated",
                        side: {
                            id: "tables-side-" + session.info.uniqueId,
                            type: "content",
                            title: {
                                id: "tables-title-" + session.info.uniqueId,
                                type: "title",
                                icon: "DatabaseTables",
                                title: () => t("pg-tables-with-schema", "Tables {{schemaName}}", { schemaName: selectedSchemaName }),
                                actions: [
                                    RefreshGridAction_ID,
                                    SearchData_ID,
                                    SelectSchemaAction_ID,
                                ],
                                actionSlotId: "tables-grid-" + session.info.uniqueId,
                            } as ITitleSlot,
                            main: {
                                id: "tables-grid-" + session.info.uniqueId,
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
                                    refresh("tables-text-" + session.info.uniqueId);
                                    refresh("tables-title-" + session.info.uniqueId);
                                    refresh("table-tab-label-" + session.info.uniqueId);
                                    refresh("columns-tab-content-" + session.info.uniqueId);
                                    refresh("indexes-tab-content-" + session.info.uniqueId);
                                    refresh("constraints-tab-content-" + session.info.uniqueId);
                                },
                                actions: [
                                    SelectSchemaAction(),
                                    ShowRelationDataAction(context => {
                                        const record = context.getData();
                                        if (record) {
                                            sendMessage(SQL_EDITOR_EXECUTE_QUERY, {
                                                to: session.info.uniqueId,
                                                from: "tables-grid-" + session.info.uniqueId,
                                                query: `select * from "${record.schema_name}"."${record.table_name}"`,
                                            });
                                        }
                                    })
                                ],
                                actionGroups: (refresh: RefreshSlotFunction) => [
                                    SelectSchemaGroup(session, selectedSchemaName, (schemaName: string) => {
                                        selectedSchemaName = schemaName;
                                        refresh("tables-grid-" + session.info.uniqueId);
                                        refresh("tables-title-" + session.info.uniqueId);
                                    }),
                                ],
                                autoSaveId: "tables-grid-" + session.profile.sch_id,
                                status: ["data-rows"]
                            } as IGridSlot,
                            text: {
                                id: "tables-text-" + session.info.uniqueId,
                                type: "text",
                                text: () => {
                                    return description ? description : "No description.";
                                },
                            } as ITextSlot
                        },
                        editors: [
                            {
                                id: "table-editors-tab-" + session.info.uniqueId,
                                type: "tab",
                                closable: false,
                                label: {
                                    id: "table-tab-label-" + session.info.uniqueId,
                                    type: "tablabel",
                                    label: () => rowTableName ? `${rowSchemaName}.${rowTableName}` : "No selected",
                                    icon: "DatabaseTables",
                                },
                                content: {
                                    id: "table-tab-content-" + session.info.uniqueId,
                                    type: "tabcontent",
                                    content: {
                                        id: "table-columns-tabs-" + session.info.uniqueId,
                                        type: "tabs",
                                        tabs: [
                                            tableColumnsTab(session, () => rowSchemaName, () => rowTableName),
                                            tableIndexesTab(session, () => rowSchemaName, () => rowTableName),
                                            {
                                                id: "constraints-tab-" + session.info.uniqueId,
                                                type: "tab",
                                                label: {
                                                    id: "constraints-tab-label-" + session.info.uniqueId,
                                                    type: "tablabel",
                                                    label: t("constraints", "Constraints"),
                                                },
                                                content: {
                                                    id: "constraints-tab-content-" + session.info.uniqueId,
                                                    type: "rendered",
                                                    render() {
                                                        return (
                                                            <div>
                                                                <h1>{t("constraints", "Constraints")}</h1>
                                                                <p>{rowSchemaName}.{rowTableName}</p>
                                                            </div>
                                                        );
                                                    }
                                                }
                                            },
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
                },
                {
                    type: "connection",
                    id: "views-" + session.info.uniqueId,
                    icon: "DatabaseViews",
                    label: t("database-views", "Views"),
                    slot: {
                        id: "views-test" + session.info.uniqueId,
                        type: "integrated",
                        side: {
                            id: "views-side-" + session.info.uniqueId,
                            type: "content",
                            main: {
                                id: "views-main-" + session.info.uniqueId,
                                type: "rendered",
                                render() {
                                    return (
                                        <div>
                                            <h1>Views</h1>
                                            <p>This is a PostgreSQL plugin for ORBADA.</p>
                                            <p>{session.profile.sch_name}</p>
                                        </div>
                                    );
                                },
                            }
                        }
                    }
                },
            ];
        });
    }
};

interface TableRecord {
    schema_name: string;
    table_name: string;
    owner_name: string;
    table_type: string;
    description: string;
}

settingsGroupDefaults[PLUGIN_ID] = {};

export default PostgresPlugin;