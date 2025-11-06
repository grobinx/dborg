import { Action } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";


export const ToggleShowRowNumberColumn = (contextMenu: boolean): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.toggleShowRowNumberColumn";

    return {
        id: id,
        label: t(id, "Show/Hide row number column"),
        keybindings: ["Ctrl+K", "R", "N"],
        contextMenuGroupId: contextMenu ? "layout" : undefined,
        contextMenuOrder: contextMenu ? 2 : undefined,
        run: (context) => {
            context.setShowRowNumberColumn(!context.isShowRowNumberColumn());
        },
    };
}