import * as monaco from "monaco-editor";
import { selectFragmentAroundCursor } from "../../../../../components/editor/editorUtils";
import { t } from "i18next";
import { Action } from "@renderer/components/CommandPalette/ActionManager";

export function SelectCurrentCommand(): Action<monaco.editor.ICodeEditor> {
    const actionId = "editor.actions.selectCurrentCommand";

    return {
        id: actionId,
        label: t(actionId, "Select current command"),
        keySequence: ["Ctrl+Shift+A"],
        run: (editor: monaco.editor.ICodeEditor) => {
            selectFragmentAroundCursor(editor);
        },
    };
}