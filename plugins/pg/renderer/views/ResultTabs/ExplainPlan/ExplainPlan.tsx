import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { ConnectionSqlResultTab } from "plugins/manager/renderer/ConnectionSlots";
import { versionToNumber } from "../../../../../../src/api/version";
import { SlotRuntimeContext } from "plugins/manager/renderer/CustomSlots";
import { resultsTabsId } from "@renderer/containers/Connections/ConnectionView/ResultsTabs";
import { SWITCH_PANEL_TAB } from "@renderer/app/Messages";
import { Action } from "@renderer/components/CommandPalette/ActionManager";
import * as monaco from "monaco-editor";
import { getFragmentAroundCursor } from "@renderer/components/editor/editorUtils";
import { ErrorResult, ExplainPlanViewer, ExplainResult } from "./ExplainPlanViewer";
import { QueryAnalyzer } from "./QueryAnalyzer";
import { QueryStats } from "./QueryStats";

export const EXPLAIN_PLAN_TEXT = "pg-explain-plan-text";

export function explainPlanResultTab(session: IDatabaseSession): ConnectionSqlResultTab {
    const t = i18next.t.bind(i18next);
    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");

    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    let unsubsribeExplainPlanText: () => void = () => { };
    let explainPlan: ExplainResult | ErrorResult | null = null;

    return {
        id: cid("explain-plan-result"),
        type: "tab",
        onMount: (slotContext) => {
            unsubsribeExplainPlanText = slotContext.messages.subscribe(
                EXPLAIN_PLAN_TEXT,
                async (sessionId: string, text: string) => {
                    if (sessionId !== session.info.uniqueId) {
                        return;
                    }

                    try {
                        const sql = `EXPLAIN (ANALYZE, VERBOSE, COSTS, SETTINGS, BUFFERS, FORMAT JSON) ${text}`;
                        const result = await session.query(sql);

                        if (result.rows && result.rows.length > 0) {
                            explainPlan = (result.rows[0]['QUERY PLAN'] as ExplainResult[])[0];
                        } else {
                            explainPlan = { error: { message: 'No plan returned' } } as ErrorResult;
                        }
                    } catch (error) {
                        explainPlan = {
                            error: {
                                message: (error as any)["message"],
                                stack: (error as any)["stack"],
                            }
                        } as ErrorResult;
                    }

                    slotContext.refresh(cid("explain-plan-result-content"));
                    slotContext.refresh(cid("explain-plan-suggestions-content"));
                    slotContext.refresh(cid("explain-plan-statistics-content"));
                    slotContext.messages.sendMessage(SWITCH_PANEL_TAB, resultsTabsId(session), cid("explain-plan-result"));
                }
            );
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
            type: "tabcontent",
            content: {
                type: "tabs",
                tabs: [
                    {
                        id: cid("explain-plan-result"),
                        type: "tab",
                        label: {
                            type: "tablabel",
                            label: t("analysis", "Analysis"),
                        },
                        content: {
                            id: cid("explain-plan-result-content"),
                            type: "rendered",
                            render: () => <ExplainPlanViewer plan={explainPlan} />,
                        },
                    },
                    {
                        id: cid("explain-plan-suggestions"),
                        type: "tab",
                        label: {
                            type: "tablabel",
                            label: t("suggestions", "Suggestions"),
                        },
                        content: {
                            id: cid("explain-plan-suggestions-content"),
                            type: "rendered",
                            render: () => <QueryAnalyzer plan={explainPlan} />,
                        },
                    },
                    {
                        id: cid("explain-plan-statistics"),
                        type: "tab",
                        label: {
                            type: "tablabel",
                            label: t("statistics", "Statistics"),
                        },
                        content: {
                            id: cid("explain-plan-statistics-content"),
                            type: "rendered",
                            render: () => <QueryStats plan={explainPlan} />,
                        },
                    },
                ]
            },
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