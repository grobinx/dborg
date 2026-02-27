import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { ConnectionSqlResultTab } from "plugins/manager/renderer/ConnectionSlots";
import { versionToNumber } from "../../../../../src/api/version";
import { SlotRuntimeContext } from "plugins/manager/renderer/CustomSlots";
import { resultsTabsId } from "@renderer/containers/Connections/ConnectionView/ResultsTabs";
import { SWITCH_PANEL_TAB } from "@renderer/app/Messages";
import { Action } from "@renderer/components/CommandPalette/ActionManager";
import * as monaco from "monaco-editor";
import { getFragmentAroundCursor } from "@renderer/components/editor/editorUtils";

export const EXPLAIN_PLAN_TEXT = "pg-explain-plan-text";

export function explainPlanResultTab(session: IDatabaseSession): ConnectionSqlResultTab {
    const t = i18next.t.bind(i18next);
    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");

    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    let unsubsribeExplainPlanText: () => void = () => { };
    let explainPlanText: string = "";

    return {
        id: cid("explain-plan-result"),
        type: "tab",
        onMount: (slotContext) => {
            unsubsribeExplainPlanText = slotContext.messages.subscribe(EXPLAIN_PLAN_TEXT, (sessionId: string, text: string) => {
                if (sessionId !== session.info.uniqueId) {
                    return;
                }
                explainPlanText = text;
                slotContext.refresh(cid("explain-plan-result-content"));
                slotContext.messages.sendMessage(SWITCH_PANEL_TAB, resultsTabsId(session), cid("explain-plan-result"));
            });
        },
        onUnmount: () => {
            unsubsribeExplainPlanText();
        },
        label: {
            type: "tablabel",
            icon: "Explain",
            label: t("explain-plan", "Explain Plan"),
        },
        content: {
            id: cid("explain-plan-result-content"),
            type: "rendered",
            render: () => explainPlanText,
        }

    }

}

export function ExplainPlanAction(session: IDatabaseSession, slotContext: SlotRuntimeContext): Action<monaco.editor.ICodeEditor> {
    return {
        id: "actions.explain-plan",
        label: i18next.t("explain-plan", "Explain Plan"),
        icon: "Explain",
        keySequence: ["Ctrl+E"],
        contextMenuGroupId: "sql-editor",
        contextMenuOrder: 5,
        run: async (editor) => {
            const selection = editor.getSelection();
            const model = editor.getModel();

            if (selection && model) {
                const selectedText = model.getValueInRange(selection);
                if (selectedText.trim()) {
                    slotContext.messages.sendMessage(EXPLAIN_PLAN_TEXT, session.info.uniqueId, selectedText);
                    return;
                }
            }

            // Jeśli nie ma zaznaczonego tekstu, użyj fragmentu wokół kursora
            const fragment = getFragmentAroundCursor(editor);
            if (fragment) {
                slotContext.messages.sendMessage(EXPLAIN_PLAN_TEXT, session.info.uniqueId, fragment.fragment);
            }
        }
    };
}