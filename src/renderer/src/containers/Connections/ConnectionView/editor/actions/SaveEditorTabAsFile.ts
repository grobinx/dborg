import * as monaco from "monaco-editor";
import { t } from "i18next";
import { Action } from "@renderer/components/CommandPalette/ActionManager";

export function SaveEditorTabAsFile(
    run: () => void
): Action<monaco.editor.ICodeEditor> {
    const actionId = "editor.actions.saveEditorTabAsFile";

    return {
        id: actionId,
        label: t(actionId, "Save Editor Content as File"),
        keySequence: ["Ctrl+Shift+S"],
        contextMenuGroupId: "sql-editor", 
        contextMenuOrder: 1,
        run: run,
    };
}
