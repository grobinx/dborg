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
import { QueryAnalyzer, DEFAULT_QUERY_ANALYZER_OPTIONS, QueryAnalyzerOptions } from "./QueryAnalyzer";
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

    let analyzerOptions: QueryAnalyzerOptions = { ...DEFAULT_QUERY_ANALYZER_OPTIONS };

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

    const refreshElements = (slotContext: SlotRuntimeContext) => {
        slotContext.refresh(cid("explain-plan-result-content"));
        slotContext.refresh(cid("explain-plan-suggestions-content"));
        slotContext.refresh(cid("explain-plan-statistics-content"));
        slotContext.refresh(cid("explain-plan-tab-label"));
        slotContext.refresh(cid("explain-plan-used-objects-content"));
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
                        slotContext.openDialog(cid("explain-plan-options-dialog"), explainOptions).then(() => {
                            refreshElements(slotContext);
                        });
                    },
                },
                {
                    id: "plan-analyzer-dialog-options",
                    label: t("plan-analyzer-options", "Plan Analyzer Options"),
                    icon: "Tools",
                    run: async () => {
                        const ok = await slotContext.openDialog(cid("plan-analyzer-options-dialog"), analyzerOptions);
                        if (ok) {
                            refreshElements(slotContext);
                        }
                    },
                },
            ]
        }),
        onMount: (slotContext) => {
            session.getProfileSettings("explain-plan-options").then((settings) => {
                if (settings) {
                    explainOptions = { ...explainOptions, ...settings };
                }
            });

            session.getProfileSettings("query-analyzer-options").then((settings) => {
                if (settings) {
                    analyzerOptions = { ...analyzerOptions, ...settings };
                    slotContext.refresh(cid("explain-plan-suggestions-content"));
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
                                refreshElements(slotContext);
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

                        refreshElements(slotContext);
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
                            refreshElements(slotContext);
                        }
                    } finally {
                        cursor?.close();

                        cancelCurrentRequest = null;

                        if (!cancelled) {
                            refreshElements(slotContext);
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
                            render: () => <QueryAnalyzer plan={explainPlan} options={analyzerOptions} />,
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
                            render: () => <QueryStats plan={explainPlan} options={analyzerOptions} />,
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
                            render: () => <UsedObjects plan={explainPlan} options={analyzerOptions} />,
                        },
                    },
                ]
            },
            dialogs: [
                {
                    id: cid("explain-plan-options-dialog"),
                    type: "dialog",
                    title: t("explain-plan-options", "Explain Plan Options"),
                    size: "large",
                    height: "80%",
                    items: [
                        {
                            type: "row",
                            items: [
                                {
                                    type: "boolean",
                                    key: "analyze",
                                    label: t("explain-analyze", "ANALYZE"),
                                    helperText: t("explain-analyze-tooltip", "Execute the query and show actual run times and row counts. This actually runs the query, so use caution with INSERT/UPDATE/DELETE. Provides real execution statistics including actual rows, loops, and timing. Mutually exclusive with GENERIC_PLAN."),
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
                                    helperText: t("explain-verbose-tooltip", "Display additional information including the output column list for each node, schema-qualified table and function names, expression tree details, and variable names in triggers. Useful for understanding complex queries in detail."),
                                },
                                {
                                    type: "boolean",
                                    key: "costs",
                                    label: t("explain-costs", "COSTS"),
                                    helperText: t("explain-costs-tooltip", "Include estimated startup and total cost for each plan node. Startup cost is the time to get the first row; Total cost is the time to get all rows. Costs are in arbitrary units determined by planner cost parameters."),
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
                                    helperText: t("explain-buffers-tooltip", "Include buffer usage statistics showing shared blocks (from shared buffer cache), local blocks (from temp tables), and temp blocks (from temporary disk files). Shows hit (found in cache), read (fetched from disk), dirtied (modified), and written counts."),
                                    restrictions: ["ANALYZE"],
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
                                    helperText: t("explain-timing-tooltip", "Include actual startup time and time spent in each node. Time is measured in milliseconds. Disabling this can reduce profiling overhead for queries with many nodes."),
                                    restrictions: ["ANALYZE"],
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
                                    helperText: t("explain-summary-tooltip", "Include summary information after the query plan, showing total planning time and (when ANALYZE is used) total execution time."),
                                    disabled: () => versionNumber < 100000,
                                    restrictions: ["PG 10+"],
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
                                    helperText: t("explain-settings-tooltip", "Include information about configuration parameters that affect query planning and have non-default values. Useful for understanding why the planner chose a particular plan. Shows parameters like work_mem, random_page_cost, etc."),
                                    disabled: () => versionNumber < 120000,
                                    restrictions: ["PG 12+"],
                                },
                                {
                                    type: "boolean",
                                    key: "wal",
                                    label: t("explain-wal", "WAL"),
                                    helperText: t("explain-wal-tooltip", "Include Write-Ahead Log usage statistics showing the number of records generated, Full Page Images (FPI) written, and total bytes written to WAL. Useful for understanding write-heavy query impact on replication and archiving."),
                                    disabled: () => versionNumber < 130000,
                                    onChange: (values: Record<string, any>, value: any) => {
                                        if (value) {
                                            values["analyze"] = true;
                                        }
                                    },
                                    restrictions: ["ANALYZE", "PG 13+"],
                                },
                                {
                                    type: "boolean",
                                    key: "memory",
                                    label: t("explain-memory", "MEMORY"),
                                    helperText: t("explain-memory-tooltip", "Include memory usage information for nodes that use significant memory, such as Hash, Sort, and Materialize nodes. Shows peak memory usage and whether the operation spilled to disk. Useful for identifying memory-intensive operations."),
                                    disabled: () => versionNumber < 170000,
                                    restrictions: ["PG 17+"],
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
                                    helperText: t("explain-generic-plan-tooltip", "Show the generic plan for a prepared statement rather than a custom plan specific to the current parameter values. Useful for understanding how prepared statements will perform with varying parameters. Mutually exclusive with ANALYZE."),
                                    disabled: () => versionNumber < 160000,
                                    onChange: (values: Record<string, any>, value: any) => {
                                        if (value) {
                                            values["analyze"] = false;
                                            values["timing"] = false;
                                        }
                                    },
                                    restrictions: ["PG 16+"],
                                },
                                {
                                    type: "boolean",
                                    key: "serialize",
                                    label: t("explain-serialize", "SERIALIZE"),
                                    helperText: t("explain-serialize-tooltip", "Include time spent serializing and deserializing data when transferring tuples between parallel query workers and the main backend process. Useful for analyzing parallel query overhead. Requires ANALYZE."),
                                    disabled: () => versionNumber < 160000,
                                    restrictions: ["PG 16+"],
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
                },
                {
                    id: cid("plan-analyzer-options-dialog"),
                    type: "dialog",
                    title: t("plan-analyzer-options", "Plan Analyzer Options"),
                    size: "large",
                    height: "80%",
                    items: [
                        {
                            type: "tabs",
                            tabs: [
                                {
                                    id: "suggestions-thresholds",
                                    label: t("qa-tab-suggestions", "Suggestions"),
                                    items: [
                                        {
                                            type: "row",
                                            items: [
                                                {
                                                    type: "number",
                                                    key: "seqScanMinRows",
                                                    label: t("qa-seq-scan-min-rows", "Seq Scan: min rows"),
                                                    min: 0,
                                                    step: 100,
                                                    helperText: t("qa-seq-scan-min-rows-tooltip", "Minimum number of rows for a Sequential Scan to trigger a suggestion. Sequential scans on large tables can be slow - consider adding indexes if they appear frequently in query plans.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "ineffectiveFilterMinRowsRemoved",
                                                    label: t("qa-filter-min-removed", "Filter: min removed rows"),
                                                    min: 0,
                                                    step: 10,
                                                    helperText: t("qa-filter-min-removed-tooltip", "Minimum number of rows filtered out to trigger an ineffective filter warning. High filter removal suggests missing or inappropriate indexes on WHERE clause conditions.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "sortMinRows",
                                                    label: t("qa-sort-min-rows", "Sort: min rows"),
                                                    min: 0,
                                                    step: 100,
                                                    helperText: t("qa-sort-min-rows-tooltip", "Minimum number of rows in a Sort operation to trigger a suggestion. Large sorts can cause disk spills - consider indexes or increasing work_mem if sorts appear at top level.")
                                                },
                                            ]
                                        },
                                        {
                                            type: "row",
                                            items: [
                                                {
                                                    type: "number",
                                                    key: "rowEstimateRatioUpper",
                                                    label: t("qa-estimate-ratio-upper", "Estimate ratio upper"),
                                                    min: 1,
                                                    step: 0.1,
                                                    helperText: t("qa-estimate-ratio-upper-tooltip", "Upper bound ratio for row estimate accuracy (actual/planned). If actual rows exceed planned rows by this factor, suggests statistics are outdated. Run ANALYZE to update table statistics.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "rowEstimateRatioLower",
                                                    label: t("qa-estimate-ratio-lower", "Estimate ratio lower"),
                                                    min: 0.0001,
                                                    step: 0.1,
                                                    helperText: t("qa-estimate-ratio-lower-tooltip", "Lower bound ratio for row estimate accuracy (actual/planned). If actual rows are much fewer than planned, suggests statistics are outdated or query selectivity is underestimated.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "nestedLoopMinOuterRows",
                                                    label: t("qa-nested-loop-min-rows", "Nested Loop: min outer rows"),
                                                    min: 0,
                                                    step: 10,
                                                    helperText: t("qa-nested-loop-min-rows-tooltip", "Minimum number of outer rows in a Nested Loop join to trigger a warning. Nested loops with many outer rows can be inefficient - consider hash or merge joins instead.")
                                                },
                                            ]
                                        },
                                        {
                                            type: "row",
                                            items: [
                                                {
                                                    type: "number",
                                                    key: "aggregateMinRows",
                                                    label: t("qa-aggregate-min-rows", "Aggregate: min rows"),
                                                    min: 0,
                                                    step: 100,
                                                    helperText: t("qa-aggregate-min-rows-tooltip", "Minimum number of rows in an Aggregate operation to suggest optimization. Large aggregations may benefit from partial aggregation, parallel execution, or materialized views.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "correlatedSubqueryMinLoops",
                                                    label: t("qa-subquery-min-loops", "Correlated subquery: min loops"),
                                                    min: 1,
                                                    step: 1,
                                                    helperText: t("qa-subquery-min-loops-tooltip", "Minimum number of loops (repeated executions) for correlated subqueries to trigger a warning. High loop counts indicate the subquery executes per-row - consider rewriting as a JOIN or using LATERAL.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "limitDiscardMultiplier",
                                                    label: t("qa-limit-discard-multiplier", "LIMIT discard multiplier"),
                                                    min: 1,
                                                    step: 1,
                                                    helperText: t("qa-limit-discard-multiplier-tooltip", "Multiplier for detecting excessive row discarding with LIMIT. If rows retrieved exceed LIMIT by this factor, suggests sort/filter should happen earlier or indexes are missing.")
                                                },
                                            ]
                                        },
                                        {
                                            type: "row",
                                            items: [
                                                {
                                                    type: "number",
                                                    key: "slowIndexScanMinTimeMs",
                                                    label: t("qa-index-scan-min-time", "Index Scan: min time (ms)"),
                                                    min: 0,
                                                    step: 1,
                                                    helperText: t("qa-index-scan-min-time-tooltip", "Minimum execution time in milliseconds for an Index Scan to be flagged as slow. Slow index scans may indicate bloated indexes (run REINDEX), poor index selectivity, or need for covering indexes.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "slowIndexScanMinRows",
                                                    label: t("qa-index-scan-min-rows", "Index Scan: min rows"),
                                                    min: 0,
                                                    step: 100,
                                                    helperText: t("qa-index-scan-min-rows-tooltip", "Minimum number of rows in a slow Index Scan to trigger a warning. Large index scans retrieving many rows might be better served by sequential scans - adjust random_page_cost if inappropriate.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "highDiskIOMinSharedReadBlocks",
                                                    label: t("qa-disk-io-min-reads", "Disk I/O: min shared read blocks"),
                                                    min: 0,
                                                    step: 10,
                                                    helperText: t("qa-disk-io-min-reads-tooltip", "Minimum number of shared buffer blocks read from disk to flag high disk I/O. High reads indicate cache misses - consider increasing shared_buffers, adding indexes, or reviewing query patterns.")
                                                },
                                            ]
                                        },
                                    ]
                                },
                                {
                                    id: "statistics-thresholds",
                                    label: t("qa-tab-statistics", "Statistics"),
                                    items: [
                                        {
                                            type: "row",
                                            items: [
                                                {
                                                    type: "number",
                                                    key: "executionTimeWarningMs",
                                                    label: t("qa-execution-time-warning", "Execution time warning (ms)"),
                                                    min: 0,
                                                    step: 10,
                                                    helperText: t("qa-execution-time-warning-tooltip", "Minimum execution time in milliseconds to show warning in Statistics tab. Helps identify slow queries that may need optimization.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "seqScanWarningCount",
                                                    label: t("qa-seq-scan-warning-count", "Seq scan warning count"),
                                                    min: 0,
                                                    step: 1,
                                                    helperText: t("qa-seq-scan-warning-count-tooltip", "Minimum number of sequential scans to show warning in Statistics. Multiple seq scans may indicate missing indexes or suboptimal query structure.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "nestedLoopWarningCount",
                                                    label: t("qa-nested-loop-warning-count", "Nested loop warning count"),
                                                    min: 0,
                                                    step: 1,
                                                    helperText: t("qa-nested-loop-warning-count-tooltip", "Minimum number of nested loop joins to show warning. Multiple nested loops can multiply execution time - consider hash or merge joins.")
                                                },
                                            ]
                                        },
                                        {
                                            type: "row",
                                            items: [
                                                {
                                                    type: "number",
                                                    key: "sortWarningCount",
                                                    label: t("qa-sort-warning-count", "Sort warning count"),
                                                    min: 0,
                                                    step: 1,
                                                    helperText: t("qa-sort-warning-count-tooltip", "Minimum number of sort operations to show warning. Multiple sorts can cause disk spills - consider indexes on ORDER BY columns.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "rowsFilteredWarningRatio",
                                                    label: t("qa-rows-filtered-warning-ratio", "Rows filtered warning ratio"),
                                                    min: 0,
                                                    max: 1,
                                                    step: 0.1,
                                                    helperText: t("qa-rows-filtered-warning-ratio-tooltip", "Ratio (0.0-1.0) of filtered rows to total rows to trigger warning. High ratios suggest inefficient WHERE clauses or missing indexes.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "cacheHitRatioWarningThreshold",
                                                    label: t("qa-cache-hit-ratio", "Cache hit ratio threshold"),
                                                    min: 0,
                                                    max: 1,
                                                    step: 0.05,
                                                    helperText: t("qa-cache-hit-ratio-tooltip", "Minimum cache hit ratio (0.0-1.0) to show success color. Low ratios indicate too many disk reads - consider increasing shared_buffers.")
                                                },
                                            ]
                                        },
                                        {
                                            type: "row",
                                            items: [
                                                {
                                                    type: "number",
                                                    key: "parallelEfficiencyWarningThreshold",
                                                    label: t("qa-parallel-efficiency", "Parallel efficiency threshold (%)"),
                                                    min: 0,
                                                    max: 100,
                                                    step: 5,
                                                    helperText: t("qa-parallel-efficiency-tooltip", "Minimum parallel efficiency percentage to show success. Low values suggest poor parallelization - check max_parallel_workers settings.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "rowEstimateErrorWarningThreshold",
                                                    label: t("qa-row-estimate-warning", "Row estimate error warning"),
                                                    min: 1,
                                                    step: 0.5,
                                                    helperText: t("qa-row-estimate-warning-tooltip", "Multiplier threshold for row estimate error to show warning. Values above this suggest outdated statistics - run ANALYZE.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "rowEstimateErrorErrorThreshold",
                                                    label: t("qa-row-estimate-error", "Row estimate error threshold"),
                                                    min: 1,
                                                    step: 1,
                                                    helperText: t("qa-row-estimate-error-tooltip", "Multiplier threshold for row estimate error to show error. Severe estimation errors can lead to wrong join strategies.")
                                                },
                                            ]
                                        },
                                        {
                                            type: "row",
                                            items: [
                                                {
                                                    type: "number",
                                                    key: "costEstimateErrorWarningThreshold",
                                                    label: t("qa-cost-estimate-warning", "Cost estimate error warning"),
                                                    min: 1,
                                                    step: 0.5,
                                                    helperText: t("qa-cost-estimate-warning-tooltip", "Multiplier threshold for cost estimate error to show warning. High values indicate planner cost parameters may need tuning.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "sharedReadBlocksWarningThreshold",
                                                    label: t("qa-shared-read-blocks", "Shared read blocks warning"),
                                                    min: 0,
                                                    step: 100,
                                                    helperText: t("qa-shared-read-blocks-tooltip", "Minimum shared buffer blocks read to show warning. High reads indicate cache misses - consider query optimization or increasing shared_buffers.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "tempReadBlocksWarningThreshold",
                                                    label: t("qa-temp-read-blocks", "Temp read blocks warning"),
                                                    min: 0,
                                                    step: 10,
                                                    helperText: t("qa-temp-read-blocks-tooltip", "Minimum temp buffer blocks read to show warning. Temp reads indicate work_mem exhaustion - consider increasing work_mem.")
                                                },
                                            ]
                                        },
                                        {
                                            type: "row",
                                            items: [
                                                {
                                                    type: "number",
                                                    key: "tempWrittenBlocksWarningThreshold",
                                                    label: t("qa-temp-written-blocks", "Temp written blocks warning"),
                                                    min: 0,
                                                    step: 10,
                                                    helperText: t("qa-temp-written-blocks-tooltip", "Minimum temp buffer blocks written to show warning. Temp writes indicate disk spills - increase work_mem to keep operations in memory.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "hashBatchesWarningThreshold",
                                                    label: t("qa-hash-batches", "Hash batches warning"),
                                                    min: 0,
                                                    step: 1,
                                                    helperText: t("qa-hash-batches-tooltip", "Minimum hash batches to show warning. Multiple batches mean hash table didn't fit in work_mem - increase work_mem for hash joins.")
                                                },
                                            ]
                                        },
                                    ]
                                },
                                {
                                    id: "visual-thresholds",
                                    label: t("qa-tab-visual", "Visual"),
                                    items: [
                                        {
                                            type: "row",
                                            items: [
                                                {
                                                    type: "number",
                                                    key: "removedRowsWarningThreshold",
                                                    label: t("qa-removed-rows-warning", "Removed rows warning threshold"),
                                                    min: 0,
                                                    max: 1,
                                                    step: 0.1,
                                                    helperText: t("qa-removed-rows-warning-tooltip", "Ratio (0.0-1.0) of removed rows to total scanned rows to show warning color in plan viewer. High ratios suggest inefficient filtering.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "removedRowsErrorThreshold",
                                                    label: t("qa-removed-rows-error", "Removed rows error threshold"),
                                                    min: 0,
                                                    max: 1,
                                                    step: 0.1,
                                                    helperText: t("qa-removed-rows-error-tooltip", "Ratio (0.0-1.0) of removed rows to total scanned rows to show error color. Very high ratios indicate severe filtering inefficiency.")
                                                },
                                            ]
                                        },
                                    ]
                                },
                                {
                                    id: "functions-thresholds",
                                    label: t("qa-tab-functions", "Functions"),
                                    items: [
                                        {
                                            type: "row",
                                            items: [
                                                {
                                                    type: "number",
                                                    key: "functionRiskHighTime",
                                                    label: t("qa-function-risk-time", "Function risk: high time (ms)"),
                                                    min: 0,
                                                    step: 10,
                                                    helperText: t("qa-function-risk-time-tooltip", "Minimum execution time in milliseconds to flag function as high risk in Used Objects. Slow functions may need optimization or caching.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "functionRiskHighCalls",
                                                    label: t("qa-function-risk-calls", "Function risk: high calls"),
                                                    min: 0,
                                                    step: 1000,
                                                    helperText: t("qa-function-risk-calls-tooltip", "Minimum estimated calls to flag function as high risk. High call counts in loops can multiply execution time - consider set-based alternatives.")
                                                },
                                                {
                                                    type: "number",
                                                    key: "functionRiskHighReads",
                                                    label: t("qa-function-risk-reads", "Function risk: high reads"),
                                                    min: 0,
                                                    step: 10,
                                                    helperText: t("qa-function-risk-reads-tooltip", "Minimum shared buffer blocks read to flag function as high risk. High I/O in functions suggests inefficient data access patterns.")
                                                },
                                            ]
                                        },
                                    ]
                                },
                            ]
                        },
                    ],
                    onConfirm: (values) => {
                        analyzerOptions = {
                            seqScanMinRows: values.seqScanMinRows ?? analyzerOptions.seqScanMinRows,
                            ineffectiveFilterMinRowsRemoved: values.ineffectiveFilterMinRowsRemoved ?? analyzerOptions.ineffectiveFilterMinRowsRemoved,
                            sortMinRows: values.sortMinRows ?? analyzerOptions.sortMinRows,
                            rowEstimateRatioUpper: values.rowEstimateRatioUpper ?? analyzerOptions.rowEstimateRatioUpper,
                            rowEstimateRatioLower: values.rowEstimateRatioLower ?? analyzerOptions.rowEstimateRatioLower,
                            nestedLoopMinOuterRows: values.nestedLoopMinOuterRows ?? analyzerOptions.nestedLoopMinOuterRows,
                            aggregateMinRows: values.aggregateMinRows ?? analyzerOptions.aggregateMinRows,
                            correlatedSubqueryMinLoops: values.correlatedSubqueryMinLoops ?? analyzerOptions.correlatedSubqueryMinLoops,
                            slowIndexScanMinTimeMs: values.slowIndexScanMinTimeMs ?? analyzerOptions.slowIndexScanMinTimeMs,
                            slowIndexScanMinRows: values.slowIndexScanMinRows ?? analyzerOptions.slowIndexScanMinRows,
                            highDiskIOMinSharedReadBlocks: values.highDiskIOMinSharedReadBlocks ?? analyzerOptions.highDiskIOMinSharedReadBlocks,
                            limitDiscardMultiplier: values.limitDiscardMultiplier ?? analyzerOptions.limitDiscardMultiplier,
                            executionTimeWarningMs: values.executionTimeWarningMs ?? analyzerOptions.executionTimeWarningMs,
                            seqScanWarningCount: values.seqScanWarningCount ?? analyzerOptions.seqScanWarningCount,
                            nestedLoopWarningCount: values.nestedLoopWarningCount ?? analyzerOptions.nestedLoopWarningCount,
                            sortWarningCount: values.sortWarningCount ?? analyzerOptions.sortWarningCount,
                            rowsFilteredWarningRatio: values.rowsFilteredWarningRatio ?? analyzerOptions.rowsFilteredWarningRatio,
                            cacheHitRatioWarningThreshold: values.cacheHitRatioWarningThreshold ?? analyzerOptions.cacheHitRatioWarningThreshold,
                            parallelEfficiencyWarningThreshold: values.parallelEfficiencyWarningThreshold ?? analyzerOptions.parallelEfficiencyWarningThreshold,
                            rowEstimateErrorWarningThreshold: values.rowEstimateErrorWarningThreshold ?? analyzerOptions.rowEstimateErrorWarningThreshold,
                            rowEstimateErrorErrorThreshold: values.rowEstimateErrorErrorThreshold ?? analyzerOptions.rowEstimateErrorErrorThreshold,
                            costEstimateErrorWarningThreshold: values.costEstimateErrorWarningThreshold ?? analyzerOptions.costEstimateErrorWarningThreshold,
                            sharedReadBlocksWarningThreshold: values.sharedReadBlocksWarningThreshold ?? analyzerOptions.sharedReadBlocksWarningThreshold,
                            tempReadBlocksWarningThreshold: values.tempReadBlocksWarningThreshold ?? analyzerOptions.tempReadBlocksWarningThreshold,
                            tempWrittenBlocksWarningThreshold: values.tempWrittenBlocksWarningThreshold ?? analyzerOptions.tempWrittenBlocksWarningThreshold,
                            hashBatchesWarningThreshold: values.hashBatchesWarningThreshold ?? analyzerOptions.hashBatchesWarningThreshold,
                            removedRowsWarningThreshold: values.removedRowsWarningThreshold ?? analyzerOptions.removedRowsWarningThreshold,
                            removedRowsErrorThreshold: values.removedRowsErrorThreshold ?? analyzerOptions.removedRowsErrorThreshold,
                            functionRiskHighTime: values.functionRiskHighTime ?? analyzerOptions.functionRiskHighTime,
                            functionRiskHighCalls: values.functionRiskHighCalls ?? analyzerOptions.functionRiskHighCalls,
                            functionRiskHighReads: values.functionRiskHighReads ?? analyzerOptions.functionRiskHighReads,
                        };
                        session.storeProfileSettings("query-analyzer-options", analyzerOptions);
                    },
                },
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