import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { DataGridActionContext, DataGridContext } from "@renderer/components/DataGrid/DataGridTypes";
import i18next, { TFunction } from "i18next";

export const RefreshGridAction_ID = "dataGrid.gridSlot.actions.refresh";

const RefreshGridAction = (
    run: (context: DataGridActionContext<any>) => void
): ActionDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    return {
        id: RefreshGridAction_ID,
        keybindings: ["F5"],
        label: t(RefreshGridAction_ID, "Refresh list"),
        icon: "Refresh",
        contextMenuGroupId: "objectGrid",
        contextMenuOrder: 2,
        run: run,
    };
}

export default RefreshGridAction;