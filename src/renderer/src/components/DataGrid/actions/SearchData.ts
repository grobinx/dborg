import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const SearchData_ID = "dataGrid.actions.searchData";

export const SearchData = (): ActionDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    return {
        id: SearchData_ID,
        keybindings: ["Ctrl+F"],
        label: t(SearchData_ID, "Search data"),
        icon: "Search",
        contextMenuGroupId: "commandPalette",
        contextMenuOrder: 2,
        run: (context) => {
            context.openCommandPalette("*", context.getSearchText());
        },
    };
}