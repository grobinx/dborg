import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const ResetFontSize = (initialFontSize: number): ActionDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.resetFontSize";

    return {
        id: id,
        label: t(id, "Reset font size"),
        run: (context) => {
            context.setFontSize(initialFontSize);
        },
    };
}