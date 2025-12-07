import * as monaco from "monaco-editor";
import { t } from "i18next";

export function OpenFileSqlEditorTab(
    run: () => void
): monaco.editor.IActionDescriptor {
    const actionId = "editor.actions.openFileSqlEditorTab";

    return {
        id: actionId,
        label: t(actionId, "Open File in SQL Editor tab"),
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyO],
        contextMenuGroupId: "sql-editor", 
        contextMenuOrder: 1,
        run: run,
    };
}
