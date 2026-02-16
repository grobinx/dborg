import * as monaco from "monaco-editor";
import { t } from "i18next";
import { Action } from "@renderer/components/CommandPalette/ActionManager";

export function MenuReopenSqlEditorTab(
    run: () => void
): Action<monaco.editor.ICodeEditor> {
    const actionId = "editor.actions.menuReopenSqlEditorTab";

    return {
        id: actionId,
        label: t(actionId, "Reopen SQL Editor tab"), 
        keySequence: ["Ctrl+Shift+T"],
        run: run
    };
}
