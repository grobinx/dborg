import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const OpenCommandPalette = (): ActionDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.openCommandPalette";

    return {
        id: id,
        keybindings: ["F1"],
        label: t(id, "Open command palette"),
        contextMenuGroupId: "commandPalette",
        contextMenuOrder: 1,
        run: (context) => {
            context.openCommandPalette(">", "");
        },
    };
}