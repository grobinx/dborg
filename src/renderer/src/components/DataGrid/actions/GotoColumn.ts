import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const GotoColumn = (): ActionDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.gotoColumn";

    return {
        id: id,
        keybindings: ["Ctrl+E"],
        label: t(id, "Go to column"),
        contextMenuGroupId: "commandPalette",
        contextMenuOrder: 999,
        run: (context) => {
            context.openCommandPalette("@", "");
        },
    };
}