import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const GotoColumn = (t: TFunction<"translation", undefined>): ActionDescriptor<DataGridActionContext<any>> => {
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