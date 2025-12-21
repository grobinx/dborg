import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { ViewRecord } from "./viewsView";
import i18next from "i18next";
import { uuidv7 } from "uuidv7";
import { ITabSlot } from "plugins/manager/renderer/CustomSlots";
import columnsTab from "./columnsTab";
import indexesTab from "./indexesTab";
import constraintsTab from "./constraintsTab";
import triggersTab from "./triggersTab";
import ddlTab from "./ddlTab";
import functionsTab from "./functionsTab";
import matRefreshTab from "./matRefreshTab";
import storageTab from "./storageTab";
import rlsPoliciesTab from "./rlsPoliciesTab";
import aclTab from "./aclTab";
import rulesTab from "./rulesTab";
import locksTab from "./locksTab";
import queryPlansTab from "./queryPlansTab";

export function viewView(session: IDatabaseSession, view: (() => ViewRecord | null) | ViewRecord, pinned: boolean = false): ITabSlot {
    const t = i18next.t.bind(i18next);
    const uniqueId = uuidv7();

    const cid = (id: string) => {
        return `${id}-${session.info.uniqueId}${pinned ? `-${uniqueId}` : ""}`;
    }

    const getView = (view: (() => ViewRecord | null) | ViewRecord) => {
        if (typeof view === "function") {
            return view();
        }
        return view;
    }

    return {
        id: cid("view-editors-tab"),
        type: "tab",
        closable: pinned ? true : false,
        pinnable: () => !pinned && getView(view) !== null,
        pin: () => viewView(session, getView(view)!, true),
        label: {
            id: cid("view-tab-label"),
            type: "tablabel",
            label: () => (getView(view) ? `${getView(view)!.schema_name}.${getView(view)!.view_name}` : t("not-selected", "Not selected")),
            icon: "DatabaseViews",
        },
        content: {
            id: cid("view-tab-content"),
            type: "tabcontent",
            content: {
                id: cid("view-columns-tabs"),
                type: "tabs",
                tabs: [
                    columnsTab(session, () => getView(view), cid),
                    indexesTab(session, () => getView(view), cid),
                    constraintsTab(session, () => getView(view), cid),
                    triggersTab(session, () => getView(view), cid),
                    ddlTab(session, () => getView(view), cid),
                    functionsTab(session, () => getView(view), cid),
                    matRefreshTab(session, () => getView(view), cid),
                    storageTab(session, () => getView(view), cid),
                    rlsPoliciesTab(session, () => getView(view), cid),
                    aclTab(session, () => getView(view), cid),
                    rulesTab(session, () => getView(view), cid),
                    locksTab(session, () => getView(view), cid),
                    queryPlansTab(session, () => getView(view), cid),
                ],
            },
        },
    };
}