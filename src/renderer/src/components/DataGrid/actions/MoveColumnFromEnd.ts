import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";


export const MoveColumnFromEnd = (t: TFunction<"translation", undefined>): ActionDescriptor<DataGridActionContext<any>> => {
    const id = "dataGrid.actions.moveColumnFromEnd";

    return {
        id: id,
        keybindings: ["Alt+ArrowLeft"],
        label: t(id, "Move column from end to current position"),
        run: (context) => {
            const position = context.getPosition();
            if (position) {
                const fromIndex = context.getColumnCount() - 1;
                context.moveColumn(fromIndex, position.column);
            }
        },
    };
}