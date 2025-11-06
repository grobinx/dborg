import { Action, ActionGroup } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const GotoColumnGroup = (): ActionGroup<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.groups.gotoColumn";

    return {
        id: id,
        prefix: "@",
        label: t(id, "@ To go to column"),
        actions: (context) => {
            const actions: Action<any>[] = [];
            for (let index = 0; index < context.getColumnCount(); index++) {
                const col = context.getColumn(index);
                if (col) {
                    actions.push({
                        id: `dataGrid.columns.${col.key}`,
                        label: col.label,
                        run: (context) => {
                            const { row } = context.getPosition() || { row: 0 };
                            context.setPosition({ row, column: index });
                        },
                        selected: () => {
                            const column = context.getColumn();
                            return !!column && column.key === col.key;
                        }
                    });
                }
            }
            return actions;
        },
    };
}