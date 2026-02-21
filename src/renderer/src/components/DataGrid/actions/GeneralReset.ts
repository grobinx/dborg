import { Action } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const GeneralReset = (): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.generalReset";

    return {
        id: id,
        keySequence: ["Shift+Escape"],
        label: t(id, "Reset all, filter, sort, grouping, summary"),
        icon: "Reset",
        run: (context) => {
            context.setSearchText();
            // context.resetSorting();
            context.clearSummary();
            context.clearGrouping();
            context.clearFilters();
            context.resetHiddenColumns();
        },
    };
}