import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const MoveColumnToEnd = (t: TFunction<"translation", undefined>): ActionDescriptor<DataGridActionContext<any>> => {
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
    };
}