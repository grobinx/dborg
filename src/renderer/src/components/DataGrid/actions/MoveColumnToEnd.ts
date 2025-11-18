import { Action } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const MoveColumnToEnd = (): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.moveColumnToEnd";

    return {
        id: id,
        keybindings: ["Alt+ArrowRight"],
        label: t(id, "Move column from current position to end"),
        run: (context) => {
            const position = context.getPosition();
            if (position) {
                context.moveColumn(position.column, context.getColumnCount() - 1);
            }
        },
        disabled: (context) => context.getPosition() === null,
    };
}