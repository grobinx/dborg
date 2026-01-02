import { Action } from "@renderer/components/CommandPalette/ActionManager";
import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import i18next, { TFunction } from "i18next";

export const SelectRoleAction_ID = "dataGrid.pg.actions.selectRole";

export const SelectRoleAction = (): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    return {
        id: SelectRoleAction_ID,
        keybindings: ["Ctrl+M"],
        label: t(SelectRoleAction_ID, "Select role"),
        icon: "Users",
        contextMenuGroupId: "commandPalette",
        contextMenuOrder: 999,
        run: (context) => {
            context.openCommandPalette("ROLE:", "");
        },
    };
}