import { Action } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const IncreaseFontSize = (): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.increaseFontSize";

    return {
        id: id,
        label: t(id, "Increase font size"),
        keySequence: ["Alt+Shift+ArrowDown"],
        run: (context) => {
            const newHeight = Math.min(context.getFontSize() + 2, 24);
            context.setFontSize(newHeight);
        },
    };
};