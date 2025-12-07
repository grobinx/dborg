import * as monaco from "monaco-editor";
import { t } from "i18next";

export function SaveEditorTabAsFile(
    run: () => void
): monaco.editor.IActionDescriptor {
    const actionId = "editor.actions.saveEditorTabAsFile";

    return {
        id: actionId,
        label: t(actionId, "Save Editor Content as File"),
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS],
        contextMenuGroupId: "sql-editor", 
        contextMenuOrder: 1,
        run: run,
    };
}
