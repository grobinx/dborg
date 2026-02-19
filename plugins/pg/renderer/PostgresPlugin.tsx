import { Plugin } from "plugins/manager/renderer/Plugin";
import logo from "../resources/postgresql-logo.svg"; // Importing the PostgreSQL logo
import { IPluginContext } from "plugins/manager/renderer/Plugin";
import { DRIVER_UNIQUE_ID } from "../common/consts"; // Importing the unique ID for the PostgreSQL driver
import i18next from "i18next";
import { settingsGroupDefaults, useSetting } from "@renderer/contexts/SettingsContext";
import { tablesView } from "./views/tables/tablesView";
import SettingsRegistry from "@renderer/components/settings/SettingsRegistry";
import { useTranslation } from "react-i18next";
import { FormattedText } from "@renderer/components/useful/FormattedText";
import { Stack } from "@mui/material";
import { Button } from "@renderer/components/buttons/Button";
import { useToast } from "@renderer/contexts/ToastContext";
import React from "react";
import { databaseView } from "./views/database/databaseView";
import { viewsView } from "./views/views/viewsView";
import { sequencesView } from "./views/sequences/sequencesView";
import { toolsView } from "./views/tools/toolsView";
import { aggregatesView } from "./views/aggregates/aggregatesView";

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

            return [
                databaseView(session),
                toolsView(session),
                tablesView(session),
                viewsView(session),
                sequencesView(session),
                aggregatesView(session),
            ];
        });
    }
};

settingsGroupDefaults[PLUGIN_ID] = {
    "pg_dump.path": "pg_dump",
    "pg_dump.use-for-ddl": false,
};

const PgDumpDesc: React.FC = () => {
    const { t } = useTranslation();
    const [_pdDumpFilePath, setPgDumpFilePath] = useSetting<string>(PLUGIN_ID, "pg_dump.path");
    const addToast = useToast();

    return (
        <Stack spacing={8} direction="column">
            <FormattedText text={t(
                "pg-dump-path-description",
                "Specify the path to the pg_dump executable. Typically, `pg_dump` is found in the `bin` directory of your PostgreSQL installation. You can also add the `bin` directory to your `PATH` environment variable."
            )} />
            <Stack direction="row" spacing={8} alignItems="center">
                <Button
                    onClick={async () => {
                        try {
                            const { stdout, stderr } = await window.electron.process.execFile("where", ["pg_dump"]);
                            const path = stdout.trim();
                            if (path) {
                                setPgDumpFilePath(path);
                            }
                            if (stderr) {
                                console.warn("pg_dump auto-find stderr:", stderr);
                            }
                        } catch (error) {
                            addToast("error", t("pg-dump-auto-find-error", "Failed to automatically find pg_dump path."), { reason: error });
                        }
                    }}
                    size="small"
                    color="secondary"
                >
                    {t("find", "Find")}
                </Button>
                <FormattedText text={t("pg-dump-auto-find-description", "By selecting this button, you can automatically find the path to `pg_dump`.")} />
            </Stack>
        </Stack>
    );
}

SettingsRegistry.register((context) => {
    const t = i18next.t.bind(i18next);

    context.registerCollection({
        key: PLUGIN_ID,
        title: t("postgres-plugin-settings-title", "PostgreSQL Plugin Settings"),
        groups: [
            {
                key: "pg-dump",
                title: t("pg-dump-settings-title", "pg_dump Settings"),
                settings: [
                    {
                        storageKey: "pg_dump.path",
                        type: "filePath",
                        storageGroup: PLUGIN_ID,
                        label: t("pg-dump-path-label", "pg_dump Path"),
                        description: <PgDumpDesc />,
                    },
                    {
                        storageKey: "pg_dump.use-for-ddl",
                        type: "boolean",
                        storageGroup: PLUGIN_ID,
                        label: t("pg-dump-use-for-ddl-label", "Use pg_dump for DDL"),
                        description: t("pg-dump-use-for-ddl-description", "Enable or disable the use of `pg_dump` for generating DDL. Generating DDL using `pg_dump` may be slower than other methods, but it provides a more accurate representation of the database schema."),
                    }
                ],
            }
        ],
    });
});

export default PostgresPlugin;