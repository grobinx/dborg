import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";


export const DecreaseColumnWidth = (t: TFunction<"translation", undefined>): ActionDescriptor<DataGridActionContext<any>> => {
    const id = "dataGrid.actions.decreaseColumnWidth";

    return {
        id: id,
        keybindings: ["Shift+ArrowLeft"],
        label: t(id, "Decrease column width"),
        run: (context) => {
            const width = context.getColumnWidth();
            if (width) {
                context.setColumnWidth(Math.max(width - 10, 20));
            }
        },
    };
}