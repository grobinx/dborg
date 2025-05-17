import { Plugin } from "plugins/manager/renderer/Plugin";
import logo from "../resources/postgresql-logo.svg"; // Importing the PostgreSQL logo
import { IPluginContext } from "plugins/manager/renderer/PluginContext";
import { default_settings } from "@renderer/app.config";
import { DRIVER_UNIQUE_ID } from "../common/consts"; // Importing the unique ID for the PostgreSQL driver

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
        context.registerSessionViewsFactory((session) => {
            if (session.info.driver.uniqueId !== DRIVER_UNIQUE_ID) {
                return null;
            }
            return [
                {
                    type: "session",
                    id: "tables-" + session.info.uniqueId,
                    button: {
                        icon: "DatabaseTables",
                        title: "Tables",
                        tKey: "database-tables",
                    },
                },
                {
                    type: "session",
                    id: "views-" + session.info.uniqueId,
                    button: {
                        icon: "DatabaseViews",
                        title: "Views",
                        tKey: "database-views",
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

default_settings[PLUGIN_ID] = {};

export default PostgresPlugin;