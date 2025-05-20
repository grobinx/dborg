import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";


export const MoveColumnFromEnd = (): ActionDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
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