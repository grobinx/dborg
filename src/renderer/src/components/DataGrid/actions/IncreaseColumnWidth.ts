import { Action } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const IncreaseColumnWidth = (): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.increaseColumnWidth";

    return {
        id: id,
        keySequence: ["Alt+Shift+ArrowRight"],
        label: t(id, "Increase column width"),
        run: (context) => {
            const width = context.getColumnWidth();
            if (width) {
                context.setColumnWidth(Math.min(width + 10, 1000));
            }
        },
        disabled: (context) => context.getPosition() === null,
    };
}