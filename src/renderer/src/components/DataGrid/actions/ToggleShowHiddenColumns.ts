import { Action } from "@renderer/components/CommandPalette/ActionManager";
import i18next from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const ToggleShowHiddenColumns = (): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.toggleShowHiddenColumns";

    return {
        id: id,
        keySequence: ["Alt+Shift+H"],
        label: t(id, "Show/hide hidden columns"),
        run: (context) => {
            context.toggleShowHiddenColumns();
        },
    };
};