import * as monaco from "monaco-editor";
import { t } from "i18next";
import { getFragmentAroundCursor } from "@renderer/components/editor/editorUtils";
import { Action } from "@renderer/components/CommandPalette/ActionManager";

const ExecuteQueryActionId = "editor.actions.executeQuery";

export function ExecuteQueryAction(
    onAction: (query: string) => void
): Action<monaco.editor.ICodeEditor> {

    return {
        id: ExecuteQueryActionId,
        label: t(ExecuteQueryActionId, "Execute SQL Command"),
        keySequence: ["Ctrl+Enter"],
        //keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter], // Opcjonalny skrót klawiszowy
        contextMenuGroupId: "sql-editor", // Grupa w menu kontekstowym
        contextMenuOrder: 1, // Kolejność w menu kontekstowym
        icon: "Run",
        run: (editor: monaco.editor.ICodeEditor) => {
            const selection = editor.getSelection();
            const model = editor.getModel();

            if (selection && model) {
                const selectedText = model.getValueInRange(selection);
                if (selectedText.trim()) {
                    // Jeśli jest zaznaczony tekst, użyj go
                    onAction(selectedText);
                    return;
                }
            }

            // Jeśli nie ma zaznaczonego tekstu, użyj fragmentu wokół kursora
            const fragment = getFragmentAroundCursor(editor);
            if (fragment) {
                onAction(fragment.fragment);
            }
        },
    };
}
