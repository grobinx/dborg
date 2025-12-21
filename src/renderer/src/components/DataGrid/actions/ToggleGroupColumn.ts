import { Action } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";


export const ToggleGroupColumn = (): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.toggleGroupColumn";

    return {
        id: id,
        label: t(id, "Toggle group column"),
        keybindings: ["Ctrl+K", "Ctrl+G"],
        contextMenuGroupId: "data",
        contextMenuOrder: 1,
        disabled: (context) => context.isPivoted(),
        run: (context) => {
            context.toggleGroupColumn();
        },
    };
}