import * as monaco from "monaco-editor";
import { t } from "i18next";

export function SelectQueryHistoryAction(
    onAction: () => void,
): monaco.editor.IActionDescriptor {
    const actionId = "editor.actions.selectQueryHistory";

    return {
        id: actionId,
        label: t(actionId, "Select Query History"),
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.F8],
        contextMenuGroupId: "sql-editor",
        contextMenuOrder: 1,
        run: () => {
            onAction();
        },
    };
}
