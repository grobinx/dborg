import { Plugin } from "plugins/manager/renderer/Plugin";
import logo from "../resources/postgresql-logo.svg"; // Importing the PostgreSQL logo
import { IPluginContext } from "plugins/manager/renderer/Plugin";
import { DRIVER_UNIQUE_ID } from "../common/consts"; // Importing the unique ID for the PostgreSQL driver
import i18next from "i18next";
import { settingsGroupDefaults } from "@renderer/contexts/SettingsContext";
import { tablesView } from "./views/tables";

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

            const t = i18next.t.bind(i18next);

            return [
                tablesView(session),
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