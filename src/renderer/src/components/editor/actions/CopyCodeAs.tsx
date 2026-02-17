import * as monaco from "monaco-editor";
import { changeCaseExceptQuotes } from "../editorUtils";
import { t } from "i18next";
import CodeToDialog from "@renderer/dialogs/CodeToDialog";
import { Action } from "@renderer/components/CommandPalette/ActionManager";

export function CopyCodeAs(showDialog: (dialog: React.ReactNode) => void): Action<monaco.editor.ICodeEditor> {
    const actionId = "editor.actions.copyCodeAs";

    return {
        id: actionId,
        label: t(actionId, "Copy Code As ..."),
        keySequence: ["Ctrl+Shift+C"], // Skrót klawiszowy: Ctrl+Shift+C
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

            const dialog = (
                <CodeToDialog
                    open={true}
                    onClose={() => showDialog(null)}
                    text={selectedText}
                />
            );
            showDialog(dialog);
        },
    };
}