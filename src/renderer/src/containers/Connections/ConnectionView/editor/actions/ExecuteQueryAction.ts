import * as monaco from "monaco-editor";
import { t } from "i18next";
import { getFragmentAroundCursor } from "@renderer/components/editor/editorUtils";

export function ExecuteQueryAction(
    onAction: (query: string) => void
): monaco.editor.IActionDescriptor {
    const actionId = "editor.actions.executeQuery";

    return {
        id: actionId,
        label: t(actionId, "Execute SQL Command"),
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter], // Opcjonalny skrót klawiszowy
        contextMenuGroupId: "sql-editor", // Grupa w menu kontekstowym
        contextMenuOrder: 1, // Kolejność w menu kontekstowym
        run: (editor: monaco.editor.IStandaloneCodeEditor) => {
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
