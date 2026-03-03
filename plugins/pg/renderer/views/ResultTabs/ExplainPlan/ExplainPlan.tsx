import { IDatabaseSession, IDatabaseSessionCursor } from "@renderer/contexts/DatabaseSession";
import i18next from "i18next";
import { ConnectionSqlResultTab } from "plugins/manager/renderer/ConnectionSlots";
import { versionToNumber } from "../../../../../../src/api/version";
import { SlotRuntimeContext } from "plugins/manager/renderer/CustomSlots";
import { resultsTabsId } from "@renderer/containers/Connections/ConnectionView/ResultsTabs";
import { SWITCH_PANEL_TAB } from "@renderer/app/Messages";
import { Action } from "@renderer/components/CommandPalette/ActionManager";
import * as monaco from "monaco-editor";
import { getFragmentAroundCursor } from "@renderer/components/editor/editorUtils";
import { QueryAnalyzer } from "./QueryAnalyzer";
import { QueryStats } from "./QueryStats";
import { ErrorResult, ExplainResult, ExplainResultKind, LoadingResult } from "./ExplainTypes";
import { ExplainPlanViewer } from "./ExplainPlanViewer";
import { UsedObjects } from "./UsedObjects";

export const EXPLAIN_PLAN_TEXT = "pg-explain-plan-text";

export function explainPlanResultTab(session: IDatabaseSession): ConnectionSqlResultTab {
    const t = i18next.t.bind(i18next);
    const versionNumber = versionToNumber(session.getVersion() ?? "0.0.0");

    const cid = (id: string) => `${id}-${session.info.uniqueId}`;

    let unsubsribeExplainPlanText: () => void = () => { };
    let explainPlan: ExplainResultKind | null = null;
    let cancelCurrentRequest: (() => void) | null = null;

    // Default EXPLAIN options
    let explainOptions = {
        analyze: true,
        verbose: false,
        costs: true,
        settings: false,
        generic_plan: false,
        buffers: false,
        wal: false,
        timing: true,
        summary: false,
        memory: false,
        serialize: false,
    };

    const buildExplainSQL = (text: string): string => {
        const options: string[] = [];

        // ANALYZE and GENERIC_PLAN are mutually exclusive
        if (explainOptions.analyze) {
            options.push("ANALYZE");
        } else if (explainOptions.generic_plan && versionNumber >= 160000) {
            options.push("GENERIC_PLAN");
        }

        if (explainOptions.verbose) options.push("VERBOSE");
        if (explainOptions.costs) options.push("COSTS");
        if (explainOptions.settings && versionNumber >= 120000) options.push("SETTINGS");
        if (explainOptions.buffers) options.push("BUFFERS");
        if (explainOptions.wal && versionNumber >= 130000) options.push("WAL");
        if (explainOptions.timing) options.push("TIMING");
        if (explainOptions.summary && versionNumber >= 100000) options.push("SUMMARY");
        if (explainOptions.memory && versionNumber >= 170000) options.push("MEMORY");
        if (explainOptions.serialize && versionNumber >= 160000) options.push("SERIALIZE");
        options.push('FORMAT JSON');

        return `EXPLAIN (${options.join(", ")}) ${text}`;
    };

    return {
        id: cid("explain-plan-result"),
        type: "tab",
        toolBar: (slotContext) => ({
            type: "toolbar",
            tools: [
                {
                    id: "explain-plan-dialog-options",
                    label: t("explain-plan-options", "Explain Plan Options"),
                    icon: "Settings",
                    run: () => {
                        slotContext.openDialog(cid("explain-plan-options-dialog"), explainOptions);
                    },
                },
            ]
        }),
        onMount: (slotContext) => {
            session.getProfileSettings("explain-plan-options").then((settings) => {
                if (settings) {
                    explainOptions = {
                        ...explainOptions,
                        ...settings,
                    };
                }
            });
            unsubsribeExplainPlanText = slotContext.messages.subscribe(
                EXPLAIN_PLAN_TEXT,
                async (sessionId: string, text: string, widthOptions: boolean) => {
                    if (sessionId !== session.info.uniqueId || cancelCurrentRequest) {
                        return;
                    }

                    if (widthOptions && !await slotContext.openDialog(cid("explain-plan-options-dialog"), explainOptions)) {
                        return;
                    }

                    let cursor: IDatabaseSessionCursor | null = null;
                    let cancelled = false;

                    try {
                        const sql = buildExplainSQL(text);
                        cursor = await session.open(sql, [], 1);

                        cancelCurrentRequest = () => {
                            cancelled = true;
                            try {
                                cursor?.cancel();
                                explainPlan = {
                                    loading: {
                                        message: t("cancelling-explain-plan", "Cancelling explain plan..."),
                                    },
                                } as LoadingResult;
                                slotContext.refresh(cid("explain-plan-result-content"));
                                slotContext.refresh(cid("explain-plan-suggestions-content"));
                                slotContext.refresh(cid("explain-plan-statistics-content"));
                                slotContext.refresh(cid("explain-plan-tab-label"));
                                slotContext.refresh(cid("explain-plan-used-objects-content"));
                            } catch {
                                // ignore
                            }
                        };

                        explainPlan = {
                            loading: {
                                message: t("loading-explain-plan", "Loading explain plan..."),
                                cancel: cancelCurrentRequest,
                            },
                        } as LoadingResult;

                        slotContext.refresh(cid("explain-plan-result-content"));
                        slotContext.refresh(cid("explain-plan-suggestions-content"));
                        slotContext.refresh(cid("explain-plan-statistics-content"));
                        slotContext.refresh(cid("explain-plan-tab-label"));
                        slotContext.refresh(cid("explain-plan-used-objects-content"));
                        slotContext.messages.sendMessage(SWITCH_PANEL_TAB, resultsTabsId(session), cid("explain-plan-result"));

                        const rows = await cursor.fetch();
                        if (cancelled) {
                            explainPlan = { error: { message: t("explain-plan-cancelled", "Explain plan cancelled") } } as ErrorResult;
                            return;
                        }

                        if (rows && rows.length > 0) {
                            explainPlan = (rows[0]["QUERY PLAN"] as ExplainResult[])[0];
                        } else {
                            explainPlan = { error: { message: "No plan returned" } } as ErrorResult;
                        }
                    } catch (error) {
                        if (!cancelled) {
                            explainPlan = {
                                error: {
                                    message: (error as any)?.message ?? String(error),
                                    stack: (error as any)?.stack,
                                },
                            } as ErrorResult;
                        } else {
                            explainPlan = { error: { message: t("explain-plan-cancelled", "Explain plan cancelled") } } as ErrorResult;
                            slotContext.refresh(cid("explain-plan-result-content"));
                            slotContext.refresh(cid("explain-plan-suggestions-content"));
                            slotContext.refresh(cid("explain-plan-statistics-content"));
                            slotContext.refresh(cid("explain-plan-tab-label"));
                            slotContext.refresh(cid("explain-plan-used-objects-content"));
                        }
                    } finally {
                        cursor?.close();

                        cancelCurrentRequest = null;

                        if (!cancelled) {
                            slotContext.refresh(cid("explain-plan-result-content"));
                            slotContext.refresh(cid("explain-plan-suggestions-content"));
                            slotContext.refresh(cid("explain-plan-statistics-content"));
                            slotContext.refresh(cid("explain-plan-tab-label"));
                            slotContext.refresh(cid("explain-plan-used-objects-content"));
                        }
                    }
                }
            );
        },
        onUnmount: () => {
            cancelCurrentRequest?.();
            unsubsribeExplainPlanText();
        },
        label: (slotContext) => ({
            id: cid("explain-plan-tab-label"),
            type: "tablabel",
            icon: () => cancelCurrentRequest ? <slotContext.theme.icons.Loading /> : <slotContext.theme.icons.Explain />,
            label: t("explain-plan", "Explain Plan"),
        }),
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
                    {
                        id: cid("explain-plan-used-objects"),
                        type: "tab",
                        label: {
                            type: "tablabel",
                            label: t("used-objects", "Used Objects"),
                        },
                        content: {
                            id: cid("explain-plan-used-objects-content"),
                            type: "rendered",
                            render: () => <UsedObjects plan={explainPlan} />,
                        },
                    },
                ]
            },
            dialogs: [
                {
                    id: cid("explain-plan-options-dialog"),
                    type: "dialog",
                    title: t("explain-plan-options", "Explain Plan Options"),
                    size: "medium",
                    items: [
                        {
                            type: "row",
                            items: [
                                {
                                    type: "boolean",
                                    key: "analyze",
                                    label: t("explain-analyze", "ANALYZE"),
                                    defaultValue: explainOptions.analyze,
                                    helperText: t("explain-analyze-tooltip", "Execute the query and show actual run times (all versions). Mutually exclusive with GENERIC_PLAN."),
                                    onChange: (values, value) => {
                                        if (value) {
                                            values["generic_plan"] = false;
                                        } else {
                                            if (values["timing"] === true) {
                                                values["timing"] = false;
                                            }
                                            if (values["buffers"] === true) {
                                                values["buffers"] = false;
                                            }
                                            if (values["wal"] === true) {
                                                values["wal"] = false;
                                            }
                                        }
                                    }
                                },
                                {
                                    type: "boolean",
                                    key: "verbose",
                                    label: t("explain-verbose", "VERBOSE"),
                                    defaultValue: explainOptions.verbose,
                                    helperText: t("explain-verbose-tooltip", "Display additional information including output column list, schema-qualified table and function names (all versions)"),
                                },
                                {
                                    type: "boolean",
                                    key: "costs",
                                    label: t("explain-costs", "COSTS"),
                                    defaultValue: explainOptions.costs,
                                    helperText: t("explain-costs-tooltip", "Include estimated startup and total costs for each node (all versions)"),
                                },
                            ]
                        },
                        {
                            type: "row",
                            items: [
                                {
                                    type: "boolean",
                                    key: "buffers",
                                    label: t("explain-buffers", "BUFFERS"),
                                    defaultValue: explainOptions.buffers,
                                    helperText: t("explain-buffers-tooltip", "Include buffer usage statistics: shared/local/temp blocks hit/read/dirtied/written (requires ANALYZE, all versions)"),
                                    onChange: (values: Record<string, any>, value: any) => {
                                        if (value) {
                                            values["analyze"] = true;
                                        }
                                    }
                                },
                                {
                                    type: "boolean",
                                    key: "timing",
                                    label: t("explain-timing", "TIMING"),
                                    defaultValue: explainOptions.timing,
                                    helperText: t("explain-timing-tooltip", "Include actual startup time and total time spent in each node (requires ANALYZE, all versions)"),
                                    onChange: (values: Record<string, any>, value: any) => {
                                        if (value) {
                                            values["analyze"] = true;
                                        }
                                    }
                                },
                                {
                                    type: "boolean",
                                    key: "summary",
                                    label: t("explain-summary", "SUMMARY"),
                                    defaultValue: explainOptions.summary,
                                    helperText: t("explain-summary-tooltip", "Include summary information such as total planning and execution time (PostgreSQL 10.0+)"),
                                    disabled: () => versionNumber < 100000,
                                },
                            ]
                        },
                        {
                            type: "row",
                            items: [
                                {
                                    type: "boolean",
                                    key: "settings",
                                    label: t("explain-settings", "SETTINGS"),
                                    defaultValue: explainOptions.settings,
                                    helperText: t("explain-settings-tooltip", "Include configuration parameters that affect query planning with non-default values (PostgreSQL 12+)"),
                                    disabled: () => versionNumber < 120000,
                                },
                                {
                                    type: "boolean",
                                    key: "wal",
                                    label: t("explain-wal", "WAL"),
                                    defaultValue: explainOptions.wal,
                                    helperText: t("explain-wal-tooltip", "Include WAL (Write-Ahead Log) usage statistics: records/bytes/FPI (requires ANALYZE, PostgreSQL 13+)"),
                                    disabled: () => versionNumber < 130000,
                                    onChange: (values: Record<string, any>, value: any) => {
                                        if (value) {
                                            values["analyze"] = true;
                                        }
                                    }
                                },
                                {
                                    type: "boolean",
                                    key: "memory",
                                    label: t("explain-memory", "MEMORY"),
                                    defaultValue: explainOptions.memory,
                                    helperText: t("explain-memory-tooltip", "Include memory usage information for hash/sort/materialize nodes (PostgreSQL 17+)"),
                                    disabled: () => versionNumber < 170000,
                                },
                            ]
                        },
                        {
                            type: "row",
                            items: [
                                {
                                    type: "boolean",
                                    key: "generic_plan",
                                    label: t("explain-generic-plan", "GENERIC_PLAN"),
                                    defaultValue: explainOptions.generic_plan,
                                    helperText: t("explain-generic-plan-tooltip", "Show the generic plan for a prepared statement instead of a custom plan (PostgreSQL 16+). Mutually exclusive with ANALYZE."),
                                    disabled: () => versionNumber < 160000,
                                    onChange: (values: Record<string, any>, value: any) => {
                                        if (value) {
                                            values["analyze"] = false;
                                            values["timing"] = false;
                                        }
                                    }
                                },
                                {
                                    type: "boolean",
                                    key: "serialize",
                                    label: t("explain-serialize", "SERIALIZE"),
                                    defaultValue: explainOptions.serialize,
                                    helperText: t("explain-serialize-tooltip", "Include time spent serializing/deserializing data for parallel query workers (requires ANALYZE, PostgreSQL 16+)"),
                                    disabled: () => versionNumber < 160000,
                                },
                            ]
                        },
                    ],
                    onConfirm: (values) => {
                        explainOptions = {
                            analyze: values.analyze ?? explainOptions.analyze,
                            verbose: values.verbose ?? explainOptions.verbose,
                            costs: values.costs ?? explainOptions.costs,
                            settings: values.settings ?? explainOptions.settings,
                            generic_plan: values.generic_plan ?? explainOptions.generic_plan,
                            buffers: values.buffers ?? explainOptions.buffers,
                            wal: values.wal ?? explainOptions.wal,
                            timing: values.timing ?? explainOptions.timing,
                            summary: values.summary ?? explainOptions.summary,
                            memory: values.memory ?? explainOptions.memory,
                            serialize: values.serialize ?? explainOptions.serialize,
                        };
                        session.storeProfileSettings("explain-plan-options", explainOptions);
                    },
                }
            ],
        },
    }

}

export function ExplainPlanAction(session: IDatabaseSession, slotContext: SlotRuntimeContext, widthOptions: boolean): Action<monaco.editor.ICodeEditor> {
    return {
        id: widthOptions ? "actions.explain-plan-with-options" : "actions.explain-plan",
        label: widthOptions ? i18next.t("explain-plan-with-options", "Explain Plan with Options") : i18next.t("explain-plan", "Explain Plan"),
        icon: "Explain",
        keySequence: widthOptions ? ["Ctrl+Shift+E"] : ["Ctrl+E"],
        contextMenuGroupId: "sql-editor",
        contextMenuOrder: 5,
        run: async (editor) => {
            const selection = editor.getSelection();
            const model = editor.getModel();

            if (selection && model) {
                const selectedText = model.getValueInRange(selection);
                if (selectedText.trim()) {
                    slotContext.messages.sendMessage(EXPLAIN_PLAN_TEXT, session.info.uniqueId, selectedText, widthOptions);
                    return;
                }
            }

            // Jeśli nie ma zaznaczonego tekstu, użyj fragmentu wokół kursora
            const fragment = getFragmentAroundCursor(editor);
            if (fragment) {
                slotContext.messages.sendMessage(EXPLAIN_PLAN_TEXT, session.info.uniqueId, fragment.fragment, widthOptions);
            }
        }
    };
}