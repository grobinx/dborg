import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const IncreaseColumnWidth = (t: TFunction<"translation", undefined>): ActionDescriptor<DataGridActionContext<any>> => {
    const id = "dataGrid.actions.increaseColumnWidth";

    return {
        id: id,
        keybindings: ["Shift+ArrowRight"],
        label: t(id, "Increase column width"),
        run: (context) => {
            const width = context.getColumnWidth();
            if (width) {
                context.setColumnWidth(Math.min(width + 10, 1000));
            }
        },
    };
}