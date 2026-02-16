import * as monaco from "monaco-editor";
import { t } from "i18next";
import { Action } from "@renderer/components/CommandPalette/ActionManager";

export function OpenFileSqlEditorTab(
    run: () => void
): Action<monaco.editor.ICodeEditor> {
    const actionId = "editor.actions.openFileSqlEditorTab";

    return {
        id: actionId,
        label: t(actionId, "Open File in SQL Editor tab"),
        keySequence: ["Ctrl+Shift+O"],
        contextMenuGroupId: "sql-editor", 
        contextMenuOrder: 1,
        run: run,
    };
}
