import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const DecreaseFontSize = (t: TFunction<"translation", undefined>): ActionDescriptor<DataGridActionContext<any>> => {
    const id = "dataGrid.actions.decreaseFontSize";

    return {
        id: id,
        label: t(id, "Decrease font size"),
        run: (context) => {
            const newHeight = Math.max(context.getRowHeight() - 2, 14);
            context.setRowHeight(newHeight);
        },
    };
}
