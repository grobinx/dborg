import { Plugin } from "plugins/manager/renderer/Plugin";
import logo from "../resources/postgresql-logo.svg"; // Importing the PostgreSQL logo
import { IPluginContext } from "plugins/manager/renderer/Plugin";
import { default_settings } from "@renderer/app.config";
import { DRIVER_UNIQUE_ID } from "../common/consts"; // Importing the unique ID for the PostgreSQL driver
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";

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

            if (session.info.driver.uniqueId !== DRIVER_UNIQUE_ID) {
                return null;
            }
            return [
                {
                    type: "connection",
                    id: "tables-" + session.info.uniqueId,
                    button: {
                        icon: "DatabaseTables",
                        title: "Tables",
                        tKey: "database-tables",
                    },
                    slots: [
                        {
                            id: "tables-title-" + session.info.uniqueId,
                            type: "title",
                            icon: "DatabaseTables",
                            title: "Tables",
                            tKey: "database-tables",
                        },
                        {
                            id: "tables-datagrid-" + session.info.uniqueId,
                            type: "datagrid",
                            sql: `
                                select 
                                    n.nspname as schema_name, c.relname as table_name, pg_get_userbyid(c.relowner) as owner_name, d.description,
                                    case c.relkind when 'r'::"char" then 'ordinary' when 'f'::"char" then 'foreign' when 'p'::"char" then 'partitioned' end table_type
                                from 
                                    pg_class c
                                    left join pg_namespace n on n.oid = c.relnamespace
                                    left join pg_description d on d.classoid = 'pg_class'::regclass and d.objoid = c.oid and d.objsubid = 0
                                where 
                                    c.relkind in ('r'::"char", 'f'::"char", 'p'::"char")
                                order by 
                                    schema_name, table_name`,
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
                            onRowClick: (row: TableRecord) => {
                                if (row) {
                                    description = row.description;
                                }
                                else {
                                    description = null;
                                }
                            },
                        },
                        {
                            id: "tables-text-" + session.info.uniqueId,
                            type: "text",
                            content: () => {
                                return description ? description : "No description.";
                            },
                        },
                    ],
                },
                {
                    type: "rendered",
                    id: "views-" + session.info.uniqueId,
                    button: {
                        icon: "DatabaseViews",
                        title: "Views",
                        tKey: "database-views",
                    },
                    render() {
                        return (
                            <div>
                                <h1>Views</h1>
                                <p>This is a PostgreSQL plugin for DBorg.</p>
                                <p>{session.schema.sch_name}</p>
                            </div>
                        );
                    },
                },
                {
                    type: "rendered",
                    id: "postgresql-rendered-" + session.info.uniqueId,
                    button: {
                        icon: "GroupList",
                        title: "PostgreSQL",
                        tKey: "postgresql-rendered",
                    },
                    render() {
                        return (
                            <div>
                                <h1>PostgreSQL Plugin</h1>
                                <p>This is a PostgreSQL plugin for DBorg.</p>
                                <p>{session.schema.sch_name}</p>
                            </div>
                        );
                    },
                }
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