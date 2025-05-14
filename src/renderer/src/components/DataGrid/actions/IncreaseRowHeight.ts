import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const IncreaseFontSize = (t: TFunction<"translation", undefined>): ActionDescriptor<DataGridActionContext<any>> => {
    const id = "dataGrid.actions.increaseFontSize";

    return {
        id: id,
        label: t(id, "Increase font size"),
        run: (context) => {
            const newHeight = Math.min(context.getRowHeight() + 2, 60);
            context.setRowHeight(newHeight);
        },
    };
};