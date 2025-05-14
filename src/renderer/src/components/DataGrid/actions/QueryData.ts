import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const QueryData = (t: TFunction<"translation", undefined>): ActionDescriptor<DataGridActionContext<any>> => {
    const id = "dataGrid.actions.queryData";

    return {
        id: id,
        keybindings: ["Ctrl+F"],
        label: t(id, "Search data"),
        contextMenuGroupId: "commandPalette",
        contextMenuOrder: 999,
        run: (context) => {
            context.openCommandPalette("*", "");
        },
    };
}