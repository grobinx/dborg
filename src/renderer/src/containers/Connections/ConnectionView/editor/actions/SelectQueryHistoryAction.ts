import * as monaco from "monaco-editor";
import { t } from "i18next";
import { Action } from "@renderer/components/CommandPalette/ActionManager";

export const SelectQueryHistoryActionId = "editor.actions.selectQueryHistory";

export function SelectQueryHistoryAction(
    onAction: () => void,
): Action<monaco.editor.ICodeEditor> {

    return {
        id: SelectQueryHistoryActionId,
        label: t(SelectQueryHistoryActionId, "Select Query History"),
        keySequence: ["Ctrl+F8"],
        contextMenuGroupId: "sql-editor",
        contextMenuOrder: 1,
        icon: "QueryHistory",
        run: () => {
            onAction();
        },
    };
}
