import { Action } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const SearchReset = (): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.searchReset";

    return {
        id: id,
        keySequence: ["Escape"],
        label: t(id, "Reset search"),
        icon: "ResetSearch",
        run: (context) => {
            context.setSearchText();
        },
    };
}