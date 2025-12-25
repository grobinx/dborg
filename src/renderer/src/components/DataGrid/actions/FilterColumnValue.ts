import { Action } from "@renderer/components/CommandPalette/ActionManager";
import i18next from "i18next";
import { DataGridActionContext } from "../DataGridTypes";
import { ColumnFilter } from "../useColumnsFilterState";
import { deepEqual } from "@renderer/utils/deepEqual";

export const FilterColumnValue = (): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.filterColumnValue";

    return {
        id: id,
        label: t(id, "Set/Reset Filter to Column Value"),
        keybindings: ["Alt+Shift+F"],
        run: (context) => {
            const value = context.getValue();
            if (!value) {
                return;
            }

            const isFilter = context.isTemporaryFilter();
            if (isFilter) {
                context.clearTemporaryFilter();
                return;
            }
            context.setTemporaryFilter("equals", false, [String(value)]);
        },
    };
}
