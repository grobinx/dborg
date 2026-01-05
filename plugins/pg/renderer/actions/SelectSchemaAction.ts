import { Action } from "@renderer/components/CommandPalette/ActionManager";
import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import i18next, { TFunction } from "i18next";

export const SelectSchemaAction_ID = "dataGrid.pg.actions.selectSchema";

export const SelectSchemaAction = (): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    return {
        id: SelectSchemaAction_ID,
        keySequence: ["Ctrl+M"],
        label: t(SelectSchemaAction_ID, "Select schema"),
        icon: "SelectDatabaseSchema",
        contextMenuGroupId: "commandPalette",
        contextMenuOrder: 999,
        run: (context) => {
            context.openCommandPalette("SCHEMA:", "");
        },
    };
}