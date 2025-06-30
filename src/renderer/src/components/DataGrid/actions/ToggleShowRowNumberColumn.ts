import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";


export const ToggleShowRowNumberColumn = (): ActionDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.toggleShowRowNumberColumn";

    return {
        id: id,
        label: t(id, "Show/Hide row number column"),
        contextMenuGroupId: "layout",
        contextMenuOrder: 2,
        run: (context) => {
            context.setShowRowNumberColumn(!context.isShowRowNumberColumn());
        },
    };
}