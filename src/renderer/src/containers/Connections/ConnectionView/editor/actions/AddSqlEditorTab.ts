import * as monaco from "monaco-editor";
import { TFunction } from "i18next";
import { getFragmentAroundCursor } from "@renderer/components/editor/editorUtils";

export function AddSqlEditorTab(
    t: TFunction<"translation", undefined>,
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
