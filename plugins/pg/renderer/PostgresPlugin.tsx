import { Plugin } from "plugins/manager/renderer/Plugin";
import logo from "../resources/postgresql-logo.svg"; // Importing the PostgreSQL logo
import { IPluginContext } from "plugins/manager/renderer/Plugin";
import { default_settings } from "@renderer/app.config";
import { DRIVER_UNIQUE_ID } from "../common/consts"; // Importing the unique ID for the PostgreSQL driver
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { SearchData_ID } from "@renderer/components/DataGrid/actions";
import { SelectSchemaAction, SelectSchemaAction_ID } from "./actions/SelectSchemaAction";
import { SelectSchemaGroup } from "./actions/SelectSchemaGroup";
import i18next from "i18next";
import { RefreshGridAction_ID } from "@renderer/containers/ViewSlots/actions/RefreshGridAction";
import { IGridSlot, ITextSlot, ITitleSlot } from "plugins/manager/renderer/CustomSlots";
import { RefreshSlotFunction } from "@renderer/containers/ViewSlots/RefreshSlotContext";
import tableColumnsSlot from "./slots/tableColumnsSlot";

export const PLUGIN_ID = "dborg-postgres-plugin"; // Unique identifier for the plugin

const PostgresPlugin: Plugin = {
    id: PLUGIN_ID, // Unique identifier for the plugin
    name: "PostgreSQL Plugin for DBorg", // Name of the plugin
    description: "A plugin to integrate PostgreSQL database functionality into DBorg.", // Description of the plugin
    version: "1.0.0", // Version of the plugin
    categories: ["database"], // Categories the plugin belongs to
    icon: logo, // Icon for the plugin
    author: "Andrzej Kałuża", // Author of the plugin
    licenseType: "MIT", // License type of the plugin
    keywords: ["postgresql", "database"], // Keywords associated with the plugin

    initialize(context: IPluginContext): void {
        context.registerConnectionViewsFactory((session) => {
            let description: string | null = null;
            let selectedSchemaName: string | null = null;
            let rowSchemaName: string | null = null;
            let rowTableName: string | null = null;
            const t = i18next.t.bind(i18next);

            if (session.info.driver.uniqueId !== DRIVER_UNIQUE_ID) {
                return null;
            }
            return [
                {
                    type: "connection",
                    id: "tables-" + session.info.uniqueId,
                    icon: "DatabaseTables",
                    label: t("database-tables", "Tables"),
                    slot: {
                        id: "tables-" + session.info.uniqueId,
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
                                    refresh("tables-editor-content-columns-" + session.info.uniqueId);
                                    refresh("tables-editor-label-" + session.info.uniqueId);
                                },
                                actions: [
                                    SelectSchemaAction(),
                                ],
                                actionGroups: (refresh: RefreshSlotFunction) => [
                                    SelectSchemaGroup(session, (schemaName: string) => {
                                        selectedSchemaName = schemaName;
                                        refresh("tables-grid-" + session.info.uniqueId);
                                        refresh("tables-title-" + session.info.uniqueId);
                                    }),
                                ],
                                storeLayoutId: "tables-grid-" + session.schema.sch_id,
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
                                id: "tables-editor-info-" + session.info.uniqueId,
                                type: "tab",
                                closable: false,
                                label: {
                                    id: "tables-editor-label-" + session.info.uniqueId,
                                    type: "tablabel",
                                    label: () => rowTableName ? `${rowSchemaName}.${rowTableName}` : "No selected",
                                    icon: "DatabaseTables",
                                },
                                content: {
                                    id: "tables-editor-content-" + session.info.uniqueId,
                                    type: "tabcontent",
                                    content: {
                                        id: "tables-editor-tabs-" + session.info.uniqueId,
                                        type: "tabs",
                                        defaultTabId: "tables-editor-tab-columns-" + session.info.uniqueId,
                                        tabs: [
                                            {
                                                id: "tables-editor-tab-columns-" + session.info.uniqueId,
                                                type: "tab",
                                                label: {
                                                    id: "tables-editor-label-columns-" + session.info.uniqueId,
                                                    type: "tablabel",
                                                    label: t("columns", "Columns"),
                                                },
                                                content: {
                                                    id: "tables-editor-content-columns-" + session.info.uniqueId,
                                                    type: "tabcontent",
                                                    content: () => tableColumnsSlot(session, rowSchemaName, rowTableName),
                                                }
                                            },
                                            {
                                                id: "tables-editor-tab-indexes-" + session.info.uniqueId,
                                                type: "tab",
                                                label: {
                                                    id: "tables-editor-label-indexes-" + session.info.uniqueId,
                                                    type: "tablabel",
                                                    label: t("indexes", "Indexes"),
                                                },
                                                content: {
                                                    id: "tables-editor-content-indexes-" + session.info.uniqueId,
                                                    type: "rendered",
                                                    render() {
                                                        return (
                                                            <div>
                                                                <h1>{t("indexes", "Indexes")}</h1>
                                                                <p>{rowSchemaName}.{rowTableName}</p>
                                                            </div>
                                                        );
                                                    }
                                                }
                                            },
                                            {
                                                id: "tables-editor-tab-constraints-" + session.info.uniqueId,
                                                type: "tab",
                                                label: {
                                                    id: "tables-editor-label-constraints-" + session.info.uniqueId,
                                                    type: "tablabel",
                                                    label: t("constraints", "Constraints"),
                                                },
                                                content: {
                                                    id: "tables-editor-content-constraints-" + session.info.uniqueId,
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
                                            <p>This is a PostgreSQL plugin for DBorg.</p>
                                            <p>{session.schema.sch_name}</p>
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

default_settings[PLUGIN_ID] = {};

export default PostgresPlugin;