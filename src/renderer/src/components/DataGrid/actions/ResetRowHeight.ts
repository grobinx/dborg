import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const ResetFontSize = (t: TFunction<"translation", undefined>, initialRowHeight: number): ActionDescriptor<DataGridActionContext<any>> => {
    const id = "dataGrid.actions.resetFontSize";

    return {
        id: id,
        label: t(id, "Reset font size"),
        run: (context) => {
            context.setRowHeight(initialRowHeight);
        },
    };
}