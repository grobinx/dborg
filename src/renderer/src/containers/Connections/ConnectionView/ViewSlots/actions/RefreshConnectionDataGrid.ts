import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { DataGridActionContext, DataGridContext } from "@renderer/components/DataGrid/DataGridTypes";
import i18next, { TFunction } from "i18next";

export const RefreshConnectionDataGrid_ID = "dataGrid.connectionSlot.actions.refresh";

export const RefreshConnectionDataGrid = (
    run: (context: DataGridActionContext<any>) => void
): ActionDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    return {
        id: RefreshConnectionDataGrid_ID,
        keybindings: ["F5"],
        label: t(RefreshConnectionDataGrid_ID, "Refresh list"),
        icon: "Refresh",
        contextMenuGroupId: "objectGrid",
        contextMenuOrder: 2,
        run: run,
    };
}