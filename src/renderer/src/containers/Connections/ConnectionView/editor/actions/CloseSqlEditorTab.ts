import * as monaco from "monaco-editor";
import { TFunction } from "i18next";
import { getFragmentAroundCursor } from "@renderer/components/editor/editorUtils";

export function CloseSqlEditorTab(
    t: TFunction<"translation", undefined>,
    run: () => void
): monaco.editor.IActionDescriptor {
    const actionId = "editor.actions.closeSqlEditorTab";

    return {
        id: actionId,
        label: t(actionId, "Close SQL Editor tab"), // Updated label
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyW], // Updated keybinding
        run: run,
    };
}
