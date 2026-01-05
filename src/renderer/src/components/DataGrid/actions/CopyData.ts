import { Action } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";

export const CopyData = (): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.copyData";

    return {
        id: id,
        keySequence: ["Ctrl+Shift+C"],
        label: t(id, "Copy data"),
        contextMenuGroupId: "commandPalette",
        contextMenuOrder: 5,
        run: (context) => {
            context.openCommandPalette("+", "");
        },
        disabled: (context) => context.getRowCount() === 0,
    };
}