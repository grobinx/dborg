import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";


export const SwitchColumnSort = (): ActionDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.switchColumnSort";

    return {
        id: id,
        keybindings: ["Ctrl+K", "Ctrl+O"],
        label: t(id, "Switch column sort order"),
        run: (context) => {
            const position = context.getPosition();
            if (position) {
                context.sortData(position.column);
            }
        },
    };
}