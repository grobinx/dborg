import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";


export const ToggleShowRowNumberColumn = (t: TFunction<"translation", undefined>): ActionDescriptor<DataGridActionContext<any>> => {
    const id = "dataGrid.actions.toggleShowRowNumberColumn";

    return {
        id: id,
        label: t(id, "Show/Hide row number column"),
        contextMenuGroupId: "column-layout",
        contextMenuOrder: 2,
        run: (context) => {
            context.setShowRowNumberColumn(!context.isShowRowNumberColumn());
        },
    };
}