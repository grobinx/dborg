import * as monaco from "monaco-editor";
import { t } from "i18next";
import { Action } from "@renderer/components/CommandPalette/ActionManager";

export function AddSqlEditorTab(
    run: () => void
): Action<monaco.editor.ICodeEditor> {
    const actionId = "editor.actions.addSqlEditorTab";

    return {
        id: actionId,
        label: t(actionId, "Add SQL Editor tab"),
        keySequence: ["Ctrl+N"],
        run: run,
    };
}
