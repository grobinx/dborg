import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const DecreaseFontSize = (): ActionDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
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
