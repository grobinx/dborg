import * as monaco from "monaco-editor";
import { TFunction } from "i18next";

export function MenuReopenSqlEditorTab(
    t: TFunction<"translation", undefined>,
    run: () => void
): monaco.editor.IActionDescriptor {
    const actionId = "editor.actions.menuReopenSqlEditorTab";

    return {
        id: actionId,
        label: t(actionId, "Reopen SQL Editor tab"), 
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyT],
        run: run
    };
}
