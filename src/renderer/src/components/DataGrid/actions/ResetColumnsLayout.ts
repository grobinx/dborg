import { Action } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const ResetColumnsLayout = (): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.resetColumnsLayout";

    return {
        id: id,
        keySequence: ["Alt+Shift+R"],
        label: t(id, "Reset columns layout"),
        run: (context) => {
            context.resetColumnsLayout();
        },
    };
};