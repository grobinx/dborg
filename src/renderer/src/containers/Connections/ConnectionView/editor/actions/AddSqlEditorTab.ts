import * as monaco from "monaco-editor";
import { t } from "i18next";

export function AddSqlEditorTab(
    run: () => void
): monaco.editor.IActionDescriptor {
    const actionId = "editor.actions.addSqlEditorTab";

    return {
        id: actionId,
        label: t(actionId, "Add SQL Editor tab"),
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyN], // Opcjonalny skrót klawiszowy
        run: run,
    };
}
