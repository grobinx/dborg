import { Action, ActionGroup } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";
import { exportFormats } from "@renderer/utils/arrayTo";
import { CopyDataDialog } from "@renderer/dialogs/CopyDataDialog";

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
                run: (context: DataGridActionContext<any>) => {
                    const selectedRows = context.getSelectedRows();
                    let data = context.getRows();
                    if (selectedRows.length > 0) {
                        data = selectedRows.map(i => data[i]);
                    }
                    const columns: string[] = [];
                    for (let i = 0; i < context.getColumnCount(); i++) {
                        const column = context.getColumn(i);
                        if (column && !column?.hidden) {
                            columns.push(column.key as string);
                        }
                    }
                    context.showDialog(
                        <CopyDataDialog
                            open={true}
                            onClose={() => context.showDialog(null)}
                            data={data}
                            format={key as keyof typeof exportFormats}
                            columns={columns}
                        />
                    )
                },
            }));
            return actions;
        },
        disabled: (context) => context.getRowCount() === 0,
    };
}