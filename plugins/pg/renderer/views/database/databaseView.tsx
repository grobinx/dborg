import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { ConnectionView } from "plugins/manager/renderer/Plugin";
import { Typography } from "@mui/material";
import activityTab from "./activityTab";

export function databaseView(session: IDatabaseSession): ConnectionView {
    const t = i18next.t.bind(i18next);
    let database: string | null;

    async function fetchDatabaseName() {
        const { rows } = await session.query(`select current_database() as db_name`);
        if (rows.length > 0) {
            database = rows[0].db_name as string;
        }
    }
    fetchDatabaseName();

    const cid = (id: string) => {
        return `${id}-${session.info.uniqueId}`;
    }

    return {
        type: "connection",
        id: cid("database-view"),
        icon: "DatabaseSettings",
        label: t("database", "Database"),
        tooltip: t("database-information", "Database Information"),
        section: "last",
        slot: {
            id: cid("database-slot"),
            type: "root",
            slot: {
                id: cid("database-content"),
                type: "content",
                main: () => ({
                    id: cid("database-info-tabs"),
                    type: "tabs",
                    tabs: [
                        activityTab(session, database),
                    ],
                    toolBar: {
                        id: cid("database-info-tabs-toolbar"),
                        type: "rendered",
                        render: () => {
                            return <Typography variant="body1">{t("database-information", "Database Information")}</Typography>;
                        }
                    }
                }),
            },
        }
    };
}
