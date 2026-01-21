import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { ConnectionView } from "plugins/manager/renderer/Plugin";
import tableSizesTab from "./tableSizesTab";
import roleCleanupTab from "./RoleCleanup/roleCleanupTab";

export function toolsView(session: IDatabaseSession): ConnectionView {
    const t = i18next.t.bind(i18next);

    const cid = (id: string) => {
        return `${id}-${session.info.uniqueId}`;
    }

    return {
        type: "connection",
        id: cid("tools-view"),
        icon: "Tools",
        label: t("tools", "Tools"),
        tooltip: t("tools", "Tools"),
        section: "last",
        slot: {
            id: cid("tools-slot"),
            type: "root",
            slot: {
                id: cid("tools-content"),
                type: "content",
                main: () => ({
                    id: cid("tools-info-tabs"),
                    type: "tabs",
                    tabs: [
                        tableSizesTab(session),
                        roleCleanupTab(session),
                    ],
                }),
            },
        }
    };
}
