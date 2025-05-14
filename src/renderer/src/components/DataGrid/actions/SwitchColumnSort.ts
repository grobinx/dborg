import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";


export const SwitchColumnSort = (t: TFunction<"translation", undefined>): ActionDescriptor<DataGridActionContext<any>> => {
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