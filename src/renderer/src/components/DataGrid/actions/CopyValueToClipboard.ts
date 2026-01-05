import { Action } from "@renderer/components/CommandPalette/ActionManager";
import i18next from "i18next";
import { DataGridActionContext } from "../DataGridTypes";
import { valueToString } from "../../../../../../src/api/db";

export const CopyValueToClipboard = (): Action<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.copyValueToClipboard";

    return {
        id: id,
        keySequence: ["Ctrl+C"],
        label: t(id, "Copy value to clipboard"),
        icon: "Clipboard",
        contextMenuGroupId: "clipboard",
        contextMenuOrder: 1,
        run: (context) => {
            const value = context.getValue();
            const column = context.getColumn();
            if (value !== null && value !== undefined && column) {
                if (typeof value === "object") {
                    const valueString = valueToString(value, column.dataType, { display: false });
                    navigator.clipboard.writeText(valueString);
                } else {
                    navigator.clipboard.writeText(value.toString());
                }
            }
        },
        disabled: (context) => context.getPosition() === null,
    };
};