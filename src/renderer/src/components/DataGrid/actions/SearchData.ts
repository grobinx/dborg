import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const SearchData_ID = "dataGrid.actions.searchData";

export const SearchData = (t: TFunction<"translation", undefined>): ActionDescriptor<DataGridActionContext<any>> => {
    return {
        id: SearchData_ID,
        keybindings: ["Ctrl+F"],
        label: t(SearchData_ID, "Search data"),
        icon: "Search",
        contextMenuGroupId: "commandPalette",
        contextMenuOrder: 999,
        run: (context) => {
            context.openCommandPalette("*", "");
        },
    };
}