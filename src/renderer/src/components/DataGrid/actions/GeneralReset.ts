import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const GeneralReset = (t: TFunction<"translation", undefined>): ActionDescriptor<DataGridActionContext<any>> => {
    const id = "dataGrid.actions.generalReset";

    return {
        id: id,
        keybindings: ["Escape"],
        label: t(id, "Reset filter, sorting and summary"),
        icon: "Reset",
        contextMenuGroupId: "commandPalette",
        contextMenuOrder: 999,
        run: (context) => {
            context.setSearchText();
            context.resetSorting();
            context.clearSummary();
        },
    };
}