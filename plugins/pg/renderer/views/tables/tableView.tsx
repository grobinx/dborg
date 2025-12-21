import { uuidv7 } from "uuidv7";
import { ITabSlot } from "../../../../manager/renderer/CustomSlots";
import { TableRecord } from "./tablesView";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import columnsTab from "./columnsTab";
import indexesTab from "./indexesTab";
import constraintsTab from "./constraintsTab";
import triggersTab from "./triggersTab";
import relationsTab from "./relationsTab";
import ddlTab from "./ddlTab";
import rlsPoliciesTab from "./rlsPoliciesTab";
import aclTab from "./aclTab";
import storageTab from "./storageTab";
import statisticsTab from "./statisticsTab";
import ioStatsTab from "./ioStatsTab";
import bloatTab from "./bloatTab";
import columnStatsTab from "./columnStatsTab";
import partitionsTab from "./partitionsTab";
import rulesTab from "./rulesTab";
import sequencesTab from "./sequencesTab";
import locksTab from "./locksTab";
import publicationsTab from "./publicationsTab";
import fdwTab from "./fdwTab";
import queryPlansTab from "./queryPlansTab";

export function tableView(session: IDatabaseSession, table: (() => TableRecord | null) | TableRecord, pinned: boolean = false): ITabSlot {
    const t = i18next.t.bind(i18next);
    const uniqueId = uuidv7();

    const cid = (id: string) => {
        return `${id}-${session.info.uniqueId}${pinned ? `-${uniqueId}` : ""}`;
    }

    const getTable = (table: (() => TableRecord | null) | TableRecord) => {
        if (typeof table === "function") {
            return table();
        }
        return table;
    }

    return {
        id: cid("table-editors-tab"),
        type: "tab",
        closable: pinned ? true : false,
        pin: !pinned ? () => tableView(session, getTable(table)!, true) : undefined,
        label: {
            id: cid("table-tab-label"),
            type: "tablabel",
            label: () => getTable(table) ? `${getTable(table)?.schema_name}.${getTable(table)?.table_name}` : t("not-selected", "Not selected"),
            icon: "DatabaseTables",
        },
        content: {
            id: cid("table-tab-content"),
            type: "tabcontent",
            content: {
                id: cid("table-columns-tabs"),
                type: "tabs",
                tabs: [
                    columnsTab(session, () => getTable(table), cid),
                    indexesTab(session, () => getTable(table), cid),
                    constraintsTab(session, () => getTable(table), cid),
                    triggersTab(session, () => getTable(table), cid),
                    relationsTab(session, () => getTable(table), cid),
                    ddlTab(session, () => getTable(table), cid),
                    rlsPoliciesTab(session, () => getTable(table), cid),
                    aclTab(session, () => getTable(table), cid),
                    storageTab(session, () => getTable(table), cid),
                    statisticsTab(session, () => getTable(table), cid),
                    ioStatsTab(session, () => getTable(table), cid),
                    bloatTab(session, () => getTable(table), cid),
                    columnStatsTab(session, () => getTable(table), cid),
                    partitionsTab(session, () => getTable(table), cid),
                    rulesTab(session, () => getTable(table), cid),
                    sequencesTab(session, () => getTable(table), cid),
                    locksTab(session, () => getTable(table), cid),
                    publicationsTab(session, () => getTable(table), cid),
                    fdwTab(session, () => getTable(table), cid),
                    queryPlansTab(session, () => getTable(table), cid),
                ],
            }
        },
        // actions: [
        //     ShowRelationDataAction_ID
        // ],
        // actionSlotId: "tables-grid-" + session.info.uniqueId
    };
}