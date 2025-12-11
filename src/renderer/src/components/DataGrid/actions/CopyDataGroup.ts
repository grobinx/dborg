import { Action, ActionGroup } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";
import { exportFormats } from "@renderer/utils/arrayTo";

export const CopyDataGroup = (): ActionGroup<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.groups.copyData";

    return {
        id: id,
        prefix: "+",
        label: t(id, "+ Copy data"),
        actions: () => {
            const actions: Action<any>[] = Object.entries(exportFormats).map(([key, format]) => ({
                id: `dataGrid.copyData.${key}`,
                label: format.label,
                run: async (_context) => {
                    //const data = context.getSelectedRows().map(rowIndex => context.getRowData(rowIndex));
                    //const success = await context.exportDataToClipboard(format, data);
                },
            }));
            return actions;
        },
        disabled: (context) => context.getRowCount() === 0,
    };
}