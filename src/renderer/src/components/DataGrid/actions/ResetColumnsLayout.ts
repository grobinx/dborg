import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const ResetColumnsLayout = (t: TFunction<"translation", undefined>): ActionDescriptor<DataGridActionContext<any>> => {
    const id = "dataGrid.actions.resetColumnsLayout";

    return {
        id: id,
        keybindings: ["Alt+Shift+R"],
        label: t(id, "Reset columns layout"),
        run: (context) => {
            context.resetColumnsLayout();
        },
    };
};