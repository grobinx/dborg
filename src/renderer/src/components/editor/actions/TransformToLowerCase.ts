import * as monaco from "monaco-editor";
import { changeCaseExceptQuotes } from "../editorUtils";
import { TFunction } from "i18next";

export function TransformToLowerCaseAction(t: TFunction<"translation", undefined>): monaco.editor.IActionDescriptor {
    const actionId = "editor.actions.transformToLowerCaseExceptQuotes";

    return {
        id: actionId,
        label: t(actionId, "Transform to Lower Case (Except Quotes)"),
        keybindings: [monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyL], // Skrót klawiszowy: Alt+Shift+L
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

            // Zamień tekst na małe litery z uwzględnieniem cudzysłowów
            const transformedText = changeCaseExceptQuotes(selectedText, false);

            // Zastąp zaznaczony tekst przekształconym tekstem
            editor.executeEdits("to-lower-case", [
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