import * as monaco from "monaco-editor";
import { selectFragmentAroundCursor } from "../../../../../components/editor/editorUtils";
import { t } from "i18next";

export function SelectCurrentCommand(): monaco.editor.IActionDescriptor {
    const actionId = "editor.actions.selectCurrentCommand";

    return {
        id: actionId,
        label: t(actionId, "Select current command"),
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyA],
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
            selectFragmentAroundCursor(editor);
        },
    };
}