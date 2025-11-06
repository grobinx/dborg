import { Action } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";


export const DecreaseColumnWidth = (): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.decreaseColumnWidth";

    return {
        id: id,
        keybindings: ["Alt+Shift+ArrowLeft"],
        label: t(id, "Decrease column width"),
        run: (context) => {
            const width = context.getColumnWidth();
            if (width) {
                context.setColumnWidth(Math.max(width - 10, 20));
            }
        },
    };
}