import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { ConnectionView } from "plugins/manager/renderer/Plugin";
import tableSizesTab from "./tableSizesTab";
import roleCleanupTab from "./RoleCleanup/roleCleanupTab";
import { cidFactory } from "@renderer/containers/ViewSlots/helpers";

export function toolsView(session: IDatabaseSession): ConnectionView {
    const t = i18next.t.bind(i18next);

    const cid = cidFactory("tools", session.info.uniqueId);

    return {
        type: "connection",
        id: cid("view"),
        icon: "Tools",
        label: t("tools", "Tools"),
        tooltip: t("tools", "Tools"),
        section: "last",
        slot: {
            type: "root",
            slot: {
                type: "content",
                main: () => ({
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
