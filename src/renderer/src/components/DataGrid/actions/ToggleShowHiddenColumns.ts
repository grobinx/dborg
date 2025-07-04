import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import i18next from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const ToggleShowHiddenColumns = (): ActionDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.toggleShowHiddenColumns";

    return {
        id: id,
        keybindings: ["Alt+Shift+H"],
        label: t(id, "Show/hide hidden columns"),
        contextMenuGroupId: "layout",
        contextMenuOrder: 4,
        run: (context) => {
            context.toggleShowHiddenColumns();
        },
    };
};