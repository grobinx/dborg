import * as monaco from "monaco-editor";
import { t } from "i18next";

export function CloseSqlEditorTab(
    run: () => void
): monaco.editor.IActionDescriptor {
    const actionId = "editor.actions.closeSqlEditorTab";

    return {
        id: actionId,
        label: t(actionId, "Close SQL Editor tab"), // Updated label
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW], // Updated keybinding
        run: run,
    };
}
