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
        icon: "Warning",
        label: t("database-tables", "Tables"),
        slot: {
            id: cid("database-slot"),
            type: "root",
            slot: {
                id: cid("database-content"),
                type: "rendered",
                render: () => {
                    return <div>
                        <h1>{t("database-information", "Database Information")}</h1>
                        <p>{t("connected-to-database", "Connected to database")}: {database}</p>
                        <p>{t("use-the-actions-to-manage-database-objects", "Use the actions to manage database objects.")}</p>
                    </div>;
                },
            },
        }
    };
}
