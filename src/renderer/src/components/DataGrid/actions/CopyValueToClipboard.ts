import { ActionDescriptor } from "@renderer/components/CommandPalette/ActionManager";
import i18next, { TFunction } from "i18next";
import { DataGridActionContext } from "../DataGridTypes";
import { valueToString } from "../../../../../../src/api/db";

export const CopyValueToClipboard = (): ActionDescriptor<DataGridActionContext<any>> => {
    const t = i18next.t.bind(i18next);
    const id = "dataGrid.actions.copyValueToClipboard";

    return {
        id: id,
        keybindings: ["Ctrl+C"],
        label: t(id, "Copy value to clipboard"),
        icon: "Clipboard",
        contextMenuGroupId: "clipboard",
        contextMenuOrder: 1,
        run: (context) => {
            const value = context.getValue();
            const column = context.getColumn();
            if (value !== null && value !== undefined && column) {
                const stringValue = valueToString(value, column.dataType);
                if (stringValue !== null) {
                    navigator.clipboard.writeText(stringValue);
                }
            }
        },
    };
};