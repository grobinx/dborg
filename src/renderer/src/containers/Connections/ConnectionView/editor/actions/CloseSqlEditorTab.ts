import * as monaco from "monaco-editor";
import { t } from "i18next";
import { Action } from "@renderer/components/CommandPalette/ActionManager";

export function CloseSqlEditorTab(
    run: () => void
): Action<monaco.editor.ICodeEditor> {
    const actionId = "editor.actions.closeSqlEditorTab";

    return {
        id: actionId,
        label: t(actionId, "Close SQL Editor tab"), // Updated label
        keySequence: ["Ctrl+W"], // Updated keybinding
        run: run,
    };
}
