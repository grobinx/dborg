import { Action, ActionGroup } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";
import { Column, exportFormats } from "@renderer/utils/arrayTo";
import { CopyDataDialog } from "@renderer/dialogs/CopyDataDialog";

export const CopyDataGroup = (): ActionGroup<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.groups.copyData";

    return {
        id: id,
        prefix: "+",
        label: t(id, "+ Copy data"),
        actions: () => {
            const actions: Action<any>[] = [];

            actions.push({
                id: "dataGrid.copyData.COLUMN-COMMA",
                label: t("dataGrid.copyData.COLUMN-COMMA", "Column data separated by comma"),
                run: (context: DataGridActionContext<any>) => {
                    const data = context.getData({ rows: "selected-or-all", columns: "current" });
                    const text = data.map(row => {
                        return Object.values(row).join(",");
                    }).join(",");
                    navigator.clipboard.writeText(text);
                }
            });

            actions.push(...Object.entries(exportFormats).map(([key, format]) => ({
                id: `dataGrid.copyData.${key}`,
                label: format.label,
                run: (context: DataGridActionContext<any>) => {
                    const data = context.getData({ rows: "selected-or-all", columns: "selected-or-all" });
                    const columns: Column[] = context.getSelectedColumns(true).map(col => ({ key: col.key, dataType: col.dataType }));
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
            })));

            return actions;
        },
        disabled: (context) => context.getRowCount() === 0,
    };
}