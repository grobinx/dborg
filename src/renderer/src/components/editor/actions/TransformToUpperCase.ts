import * as monaco from "monaco-editor";
import { changeCaseExceptQuotes } from "../editorUtils";
import { TFunction } from "i18next";

export function TransformToUpperCaseAction(t: TFunction<"translation", undefined>): monaco.editor.IActionDescriptor {
    const actionId = "editor.actions.transformToUpperCaseExceptQuotes";

    return {
        id: actionId,
        label: t(actionId, "Transform to Upper Case (Except Quotes)"),
        keybindings: [monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyU], // Skrót klawiszowy: Alt+Shift+U
        //contextMenuGroupId: "1_modification", // Grupa w menu kontekstowym
        //contextMenuOrder: 1, // Kolejność w menu kontekstowym
        run: (editor) => {
            const model = editor.getModel();
            const selection = editor.getSelection();

            if (!model || !selection) {
                return;
            }

            // Pobierz zaznaczony tekst
            const selectedText = model.getValueInRange(selection);

            // Zamień tekst na wielkie litery z uwzględnieniem cudzysłowów
            const transformedText = changeCaseExceptQuotes(selectedText, true);

            // Zastąp zaznaczony tekst przekształconym tekstem
            editor.executeEdits("to-upper-case", [
                {
                    range: selection,
                    text: transformedText,
                    forceMoveMarkers: true,
                },
            ]);

            // Przywróć zaznaczenie
            editor.setSelection(selection);
        },
    };
}