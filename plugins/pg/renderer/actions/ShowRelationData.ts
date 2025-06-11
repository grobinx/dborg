import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import i18next, { TFunction } from "i18next";

export const ShowRelationDataAction_ID = "dataGrid.pg.actions.showRelationData";

export const ShowRelationDataAction = (onAction: (context: DataGridActionContext<any>) => void): ActionDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    return {
        id: ShowRelationDataAction_ID,
        label: t(ShowRelationDataAction_ID, "Show relation data"),
        contextMenuGroupId: "objectGrid",
        contextMenuOrder: 3,
        run: (context) => {
            onAction(context);
        },
    };
}