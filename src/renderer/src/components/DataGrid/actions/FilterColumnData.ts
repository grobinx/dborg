import { Action } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const FilterColumnData_ID = "dataGrid.actions.filterColumnData";

export const FilterColumnData = (): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    return {
        id: FilterColumnData_ID,
        keybindings: ["Ctrl+K", "Ctrl+F"],
        label: t(FilterColumnData_ID, "Filter column data"),
        icon: "Filter",
        contextMenuGroupId: "commandPalette",
        contextMenuOrder: 3,
        run: (context) => {
            context.openCommandPalette("?", '');
        },
    };
}