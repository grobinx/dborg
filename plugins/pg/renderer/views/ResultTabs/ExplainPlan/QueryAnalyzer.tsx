import { useTranslation } from "react-i18next";
import { Box, Chip, Paper, Typography, useTheme } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { t } from "i18next";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useSetting } from "@renderer/contexts/SettingsContext";
import { ExplainResultKind, isErrorResult, isLoadingResult, PlanNode } from "./ExplainTypes";
import LoadingOverlay from "@renderer/components/useful/LoadingOverlay";
import { ExplainPlanError } from "./ExplainPlanError";
import React from "react";

interface Suggestion {
    type: 'warning' | 'info' | 'error';
    title: string;
    description: string;
    node?: string;
    recommendation?: {
        caption?: string;
        sql: string;
    }[];
}

export interface QueryAnalyzerOptions {
    seqScanMinRows: number;
    ineffectiveFilterMinRowsRemoved: number;
    sortMinRows: number;
    rowEstimateRatioUpper: number;
    rowEstimateRatioLower: number;
    nestedLoopMinOuterRows: number;
    aggregateMinRows: number;
    correlatedSubqueryMinLoops: number;
    slowIndexScanMinTimeMs: number;
    slowIndexScanMinRows: number;
    highDiskIOMinSharedReadBlocks: number;
    limitDiscardMultiplier: number;

    // QueryStats thresholds
    executionTimeWarningMs: number;
    seqScanWarningCount: number;
    nestedLoopWarningCount: number;
    sortWarningCount: number;
    rowsFilteredWarningRatio: number;
    cacheHitRatioWarningThreshold: number;
    parallelEfficiencyWarningThreshold: number;
    rowEstimateErrorWarningThreshold: number;
    rowEstimateErrorErrorThreshold: number;
    costEstimateErrorWarningThreshold: number;
    sharedReadBlocksWarningThreshold: number;
    tempReadBlocksWarningThreshold: number;
    tempWrittenBlocksWarningThreshold: number;
    hashBatchesWarningThreshold: number;

    // ExplainPlanViewer thresholds
    removedRowsWarningThreshold: number;
    removedRowsErrorThreshold: number;
    initialExpandedDepth: number;

    // UsedObjects thresholds
    functionRiskHighTime: number;
    functionRiskHighCalls: number;
    functionRiskHighReads: number;
}

export const DEFAULT_QUERY_ANALYZER_OPTIONS: QueryAnalyzerOptions = {
    seqScanMinRows: 1000,
    ineffectiveFilterMinRowsRemoved: 100,
    sortMinRows: 1000,
    rowEstimateRatioUpper: 10,
    rowEstimateRatioLower: 0.1,
    nestedLoopMinOuterRows: 100,
    aggregateMinRows: 10000,
    correlatedSubqueryMinLoops: 10,
    slowIndexScanMinTimeMs: 100,
    slowIndexScanMinRows: 5000,
    highDiskIOMinSharedReadBlocks: 100,
    limitDiscardMultiplier: 10,

    executionTimeWarningMs: 100,
    seqScanWarningCount: 2,
    nestedLoopWarningCount: 2,
    sortWarningCount: 1,
    rowsFilteredWarningRatio: 0.5,
    cacheHitRatioWarningThreshold: 0.9,
    parallelEfficiencyWarningThreshold: 80,
    rowEstimateErrorWarningThreshold: 3,
    rowEstimateErrorErrorThreshold: 10,
    costEstimateErrorWarningThreshold: 5,
    sharedReadBlocksWarningThreshold: 100,
    tempReadBlocksWarningThreshold: 100,
    tempWrittenBlocksWarningThreshold: 100,
    hashBatchesWarningThreshold: 1,

    removedRowsWarningThreshold: 0.3,
    removedRowsErrorThreshold: 0.6,
    initialExpandedDepth: 7,

    functionRiskHighTime: 100,
    functionRiskHighCalls: 10000,
    functionRiskHighReads: 100,
};

// NEW: helpers for table/schema extraction from plan
type RelationRef = { schema: string; table: string };

const quoteIdent = (value: string): string => `"${value.replace(/"/g, '""')}"`;

const findRelationInPlan = (node: PlanNode): RelationRef | null => {
    const table = node['Relation Name'];
    if (typeof table === 'string' && table.length > 0) {
        return {
            schema: (node.Schema as string) ?? 'public',
            table,
        };
    }

    if (Array.isArray(node.Plans)) {
        for (const child of node.Plans) {
            const found = findRelationInPlan(child);
            if (found) return found;
        }
    }

    return null;
};

const fqTableFromPlan = (node: PlanNode, fallback = 'table_name'): string => {
    const rel = findRelationInPlan(node);
    if (!rel) return fallback;
    return `${quoteIdent(rel.schema)}.${quoteIdent(rel.table)}`;
};

const analyzePlan = (plan: PlanNode, options: QueryAnalyzerOptions, topLevel = true): Suggestion[] => {
    const suggestions: Suggestion[] = [];

    if (plan['Node Type'] === 'Seq Scan') {
        const rows = plan['Actual Rows'] ?? plan['Plan Rows'] ?? 0;
        const execTime = plan['Actual Total Time'] ?? 0;

        if (rows > options.seqScanMinRows) {
            const filterInfo = plan.Filter ? t("query-analyzer:with-filter", "with filter") : t("query-analyzer:without-filters", "without filters");
            suggestions.push({
                type: 'warning',
                title: t("query-analyzer:seq-scan-title", "Sequential Scan on large table ({{rows}} rows, {{time}}ms)", { rows, time: execTime.toFixed(2) }),
                description: t("query-analyzer:seq-scan-desc", "Table: {{table}} ({{schema}} schema)\nScanning {{rows}} rows {{filter}} took {{time}}ms using sequential scan. This scans entire table from disk.", {
                    table: plan['Relation Name'] ?? 'unknown',
                    schema: plan.Schema ?? 'public',
                    rows,
                    filter: filterInfo,
                    time: execTime.toFixed(2)
                }),
                node: `${plan.Schema ?? 'public'}.${plan['Relation Name']}`,
                recommendation: [{
                    caption: t("query-analyzer:create-index", "Create index"),
                    sql: `CREATE INDEX idx_${plan['Relation Name']?.toLowerCase()}_col ON ${plan.Schema ?? 'public'}.${plan['Relation Name']} (column_name);`
                }]
            });
        }
    }

    if (plan['Rows Removed by Filter'] && plan['Rows Removed by Filter'] > options.ineffectiveFilterMinRowsRemoved) {
        const totalRows = (plan['Actual Rows'] ?? 0) + plan['Rows Removed by Filter'];
        const filterRate = ((plan['Rows Removed by Filter'] / totalRows) * 100).toFixed(1);

        suggestions.push({
            type: 'error',
            title: t("query-analyzer:ineffective-filter-title", "Ineffective filter (discarding {{rate}}% of rows)", { rate: filterRate }),
            description: t("query-analyzer:ineffective-filter-desc", "Table: {{table}}\nFilter: {{filter}}\nRead {{total}} rows, discarded {{removed}} rows ({{rate}}%). Filter is applied AFTER reading from disk instead of during index scan.", {
                table: plan['Relation Name'] ?? 'unknown',
                filter: plan.Filter,
                total: totalRows,
                removed: plan['Rows Removed by Filter'],
                rate: filterRate
            }),
            node: `${plan.Schema ?? 'public'}.${plan['Relation Name']}`,
            recommendation: [{
                caption: t("query-analyzer:create-index", "Create index"),
                sql: `CREATE INDEX idx_${plan['Relation Name']?.toLowerCase()}_filtered ON ${plan.Schema ?? 'public'}.${plan['Relation Name']} (column_name) WHERE ${plan.Filter};`
            }]
        });
    }

    if (plan['Node Type'] === 'Sort' && topLevel) {
        const rows = plan['Actual Rows'] ?? plan['Plan Rows'] ?? 0;
        const sortTime = plan['Actual Total Time'] ?? 0;
        const sortSpace = plan['Sort Space Used'] ?? 0;
        const sortKeys = Array.isArray(plan['Sort Key'])
            ? plan['Sort Key'].map(k => k.split(' COLLATE')[0].trim()).join(', ')
            : String(plan['Sort Key']);

        if (rows > options.sortMinRows) {
            const targetTable = fqTableFromPlan(plan);
            suggestions.push({
                type: 'warning',
                title: t("query-analyzer:large-sort-title", "Large in-memory sort ({{rows}} rows, {{time}}ms, {{space}}KB)", { rows, time: sortTime.toFixed(2), space: sortSpace }),
                description: t("query-analyzer:large-sort-desc", "Sorting {{rows}} rows took {{time}}ms and used {{space}}KB memory.\nColumns: {{columns}}\nMethod: {{method}} ({{type}})\nExpensive operation that could be avoided with proper indexing.", {
                    rows,
                    time: sortTime.toFixed(2),
                    space: sortSpace,
                    columns: sortKeys,
                    method: plan['Sort Method'] ?? 'unknown',
                    type: plan['Sort Space Type'] ?? 'unknown'
                }),
                node: t("query-analyzer:sort-operation", "Sort operation"),
                recommendation: [{
                    caption: t("query-analyzer:create-index", "Create index"),
                    sql: `CREATE INDEX idx_sort ON ${targetTable} (${sortKeys.replace(/COLLATE[^,]*/g, '').trim()});`
                }]
            });
        }
    }

    if (plan['Node Type'] === 'Hash Join' || plan['Node Type'] === 'Nested Loop') {
        const planRows = plan['Plan Rows'] ?? 0;
        const actualRows = plan['Actual Rows'] ?? 0;
        const ratio = planRows > 0 ? actualRows / planRows : 1;

        if (ratio > options.rowEstimateRatioUpper || ratio < options.rowEstimateRatioLower) {
            const direction = ratio > 10 ? t("query-analyzer:overestimated", "overestimated") : t("query-analyzer:underestimated", "underestimated");
            const diff = Math.abs(ratio - 1) * 100;

            const targetTable = fqTableFromPlan(plan);
            suggestions.push({
                type: 'info',
                title: t("query-analyzer:row-estimate-title", "Row estimate {{direction}} by {{diff}}% (planned: {{planned}}, actual: {{actual}})", { direction, diff: diff.toFixed(0), planned: planRows, actual: actualRows }),
                description: t("query-analyzer:row-estimate-desc", "Join: {{join}}\nPlanner predicted {{planned}} rows but query returned {{actual}} rows. This causes suboptimal execution plans.", {
                    join: plan['Hash Cond'] || plan['Join Filter'] || 'unknown',
                    planned: planRows,
                    actual: actualRows
                }),
                node: `${plan['Node Type']}`,
                recommendation: [{
                    caption: t("query-analyzer:analyze-table", "Analyze table"),
                    sql: `ANALYZE ${targetTable};`
                }, {
                    caption: t("query-analyzer:adjust-statistics", "Adjust statistics"),
                    sql: `ALTER TABLE ${targetTable} SET (autovacuum_analyze_scale_factor=0.01);`
                }]
            });
        }
    }

    if (plan['Node Type'] === 'Nested Loop') {
        const outerRows = plan['Actual Rows'] ?? plan['Plan Rows'] ?? 0;
        const nestTime = plan['Actual Total Time'] ?? 0;

        if (outerRows > options.nestedLoopMinOuterRows) {
            const targetTable = fqTableFromPlan(plan);
            suggestions.push({
                type: 'warning',
                title: t("query-analyzer:nested-loop-title", "Nested Loop executes {{rows}} iterations ({{time}}ms)", { rows: outerRows, time: nestTime.toFixed(2) }),
                description: t("query-analyzer:nested-loop-desc", "Join type: {{type}}\nJoin condition: {{condition}}\nInner plan executed {{rows}} times. With large datasets this becomes quadratic complexity O(n²).", {
                    type: plan['Join Type'],
                    condition: plan['Hash Cond'] || 'unknown',
                    rows: outerRows
                }),
                node: t("query-analyzer:nested-loop", "Nested Loop"),
                recommendation: [{
                    caption: t("query-analyzer:create-index", "Create index"),
                    sql: `CREATE INDEX idx_join_col ON ${targetTable} (join_column);`
                }, {
                    caption: t("query-analyzer:set-join-collapse-limit", "Set join collapse limit"),
                    sql: `SET join_collapse_limit=1;`
                }]
            });
        }
    }

    if (plan['Node Type'] === 'Aggregate') {
        const rows = plan['Actual Rows'] ?? plan['Plan Rows'] ?? 0;
        const aggTime = plan['Actual Total Time'] ?? 0;

        if (rows > options.aggregateMinRows) {
            const targetTable = fqTableFromPlan(plan);
            suggestions.push({
                type: 'warning',
                title: t("query-analyzer:expensive-aggregate-title", "Expensive aggregate operation ({{rows}} groups, {{time}}ms)", { rows, time: aggTime.toFixed(2) }),
                description: t("query-analyzer:expensive-aggregate-desc", "Aggregate creates {{rows}} groups and takes {{time}}ms. Consider if all GROUP BY columns are necessary or if data can be pre-filtered.", {
                    rows,
                    time: aggTime.toFixed(2)
                }),
                node: t("query-analyzer:aggregate", "Aggregate"),
                recommendation: [{
                    caption: t("query-analyzer:add-where-clause", "Add WHERE clause to pre-filter rows"),
                    sql: `SELECT ... FROM ${targetTable} WHERE condition GROUP BY columns;`
                }]
            });
        }
    }

    if (plan['Plans'] && plan['Plans'].length > 0) {
        const firstChild = plan['Plans'][0];
        if (firstChild['Node Type'] === 'Seq Scan' && firstChild['Actual Loops'] && firstChild['Actual Loops'] > 1) {
            const loopsCount = firstChild['Actual Loops'];
            const totalTime = (firstChild['Actual Total Time'] ?? 0) * loopsCount;

            if (loopsCount > options.correlatedSubqueryMinLoops) {
                suggestions.push({
                    type: 'warning',
                    title: t("query-analyzer:correlated-subquery-title", "Correlated subquery executed {{loops}} times ({{time}}ms total)", { loops: loopsCount, time: totalTime.toFixed(2) }),
                    description: t("query-analyzer:correlated-subquery-desc", "Subquery executed {{loops}} times (once per outer row). Total time: {{time}}ms. Consider JOIN instead of correlated subquery.", {
                        loops: loopsCount,
                        time: totalTime.toFixed(2)
                    }),
                    node: t("query-analyzer:correlated-subquery", "Correlated subquery"),
                    recommendation: [{
                        caption: t("query-analyzer:rewrite-as-join", "Rewrite as JOIN"),
                        sql: `SELECT ... FROM outer_table JOIN inner_table ON condition;`
                    }]
                });
            }
        }
    }

    if (plan['Node Type'] === 'Index Scan' || plan['Node Type'] === 'Index Only Scan') {
        const rows = plan['Actual Rows'] ?? plan['Plan Rows'] ?? 0;
        const scanTime = plan['Actual Total Time'] ?? 0;

        if (scanTime > options.slowIndexScanMinTimeMs && rows > options.slowIndexScanMinRows) {
            const targetTable = fqTableFromPlan(plan);
            suggestions.push({
                type: 'info',
                title: t("query-analyzer:slow-index-scan-title", "Slow index scan ({{rows}} rows, {{time}}ms)", { rows, time: scanTime.toFixed(2) }),
                description: t("query-analyzer:slow-index-scan-desc", "Index Scan on {{table}} returned {{rows}} rows in {{time}}ms. Consider adding more columns to index or using composite index.", {
                    table: plan['Relation Name'] ?? 'unknown',
                    rows,
                    time: scanTime.toFixed(2)
                }),
                node: `${plan['Relation Name'] ?? 'unknown'} ({{indexName}})`.replace('{{indexName}}', plan['Index Name'] ?? 'unknown'),
                recommendation: [{
                    caption: t("query-analyzer:create-composite-index", "Create composite index"),
                    sql: `CREATE INDEX idx_composite ON ${plan.Schema ?? 'public'}.${plan['Relation Name'] ?? 'table'} (id, column1, column2);`
                }]
            });
        }
    }

    if (plan['Shared Read Blocks'] && plan['Shared Read Blocks'] > options.highDiskIOMinSharedReadBlocks) {
        const readTime = plan['Actual Total Time'] ?? 0;

        const targetTable = fqTableFromPlan(plan);
        suggestions.push({
            type: 'warning',
            title: t("query-analyzer:high-disk-io-title", "High disk I/O ({{reads}} blocks read)", { reads: plan['Shared Read Blocks'] }),
            description: t("query-analyzer:high-disk-io-desc", "Node {{node}} read {{reads}} blocks from disk taking {{time}}ms. Data not in cache. Consider indexing or increasing work_mem.", {
                node: plan['Node Type'],
                reads: plan['Shared Read Blocks'],
                time: readTime.toFixed(2)
            }),
            node: t("query-analyzer:disk-io", "Disk I/O"),
            recommendation: [{
                caption: t("query-analyzer:vacuum-analyze", "Run VACUUM and ANALYZE"),
                sql: `VACUUM ANALYZE ${targetTable};`
            }, {
                caption: t("query-analyzer:increase-work-mem", "Increase work_mem"),
                sql: `SET work_mem = '256MB';`
            }]
        });
    }

    if (plan['Node Type'] === 'Limit') {
        const planRows = plan['Plan Rows'] ?? 0;
        const actualRows = plan['Actual Rows'] ?? 0;
        const outerChild = plan['Plans'] ? plan['Plans'][0] : null;

        if (outerChild && outerChild['Actual Rows'] && outerChild['Actual Rows'] > planRows * options.limitDiscardMultiplier) {
            const targetTable = fqTableFromPlan(plan);
            const discarded = outerChild['Actual Rows'] - actualRows;

            suggestions.push({
                type: 'info',
                title: t("query-analyzer:limit-discard-title", "LIMIT discards {{count}} rows", { count: discarded }),
                description: t("query-analyzer:limit-discard-desc", "LIMIT {{limit}} returned {{actual}} rows but inner query processed {{total}} rows. {{discarded}} rows were discarded. Add ORDER BY with index to optimize.", {
                    limit: planRows,
                    actual: actualRows,
                    total: outerChild['Actual Rows'],
                    discarded: discarded
                }),
                node: t("query-analyzer:limit", "LIMIT"),
                recommendation: [{
                    caption: t("query-analyzer:add-index-to-order-by", "Create index on ORDER BY column"),
                    sql: `CREATE INDEX idx_order ON ${targetTable} (order_column DESC) WHERE filter_condition;`
                }]
            });
        }
    }

    if (plan.Plans) {
        plan.Plans.forEach(child => {
            suggestions.push(...analyzePlan(child, options, false));
        });
    }

    return suggestions;
};

export const QueryAnalyzer: React.FC<{ plan: ExplainResultKind | null; options?: Partial<QueryAnalyzerOptions> }> = ({ plan, options }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const [fontSize] = useSetting<number>("ui", "fontSize");
    const [monospaceFontFamily] = useSetting<string>("ui", "monospaceFontFamily");

    const analyzerOptions: QueryAnalyzerOptions = { ...DEFAULT_QUERY_ANALYZER_OPTIONS, ...options };

    const suggestions = React.useMemo(() => {
        if (plan && !isErrorResult(plan) && !isLoadingResult(plan)) {
            return analyzePlan(plan.Plan, analyzerOptions);
        }
        return [];
    }, [plan, options]);

    if (isErrorResult(plan)) {
        return <ExplainPlanError error={plan} />;
    }

    if (isLoadingResult(plan)) {
        return (
            <LoadingOverlay label={plan.loading.message} onCancelLoading={plan.loading.cancel} />
        );
    }

    if (!plan) {
        return (
            <Box sx={{ p: 8 }}>
                <Typography color="text.secondary">{t("no-explain-plan-data", "No explain plan data")}</Typography>
            </Box>
        );
    }

    if (suggestions.length === 0) {
        return (
            <Box sx={{ px: 8, py: 4, height: '100%', overflow: 'auto' }}>
                <Paper sx={{ px: 8, py: 4, backgroundColor: 'success.dark', color: 'success.contrastText' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box>
                            <Typography variant="h6">
                                {t("no-optimization-suggestions", "No optimization suggestions")}
                            </Typography>
                            <Typography variant="body2">
                                {t("query-plan-looks-good", "Query plan looks good")}
                            </Typography>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        );
    }

    return (
        <Box sx={{ px: 8, py: 4, height: '100%', overflow: 'auto' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {suggestions.map((sugg, idx) => {
                    let borderColor: string;

                    if (sugg.type === 'error') {
                        borderColor = theme.palette.error.main;
                    } else if (sugg.type === 'warning') {
                        borderColor = theme.palette.warning.main;
                    } else {
                        borderColor = theme.palette.info.main;
                    }

                    return (
                        <Paper
                            key={idx}
                            elevation={1}
                            sx={{
                                px: 8,
                                py: 4,
                                mb: 4,
                                backgroundColor: 'background.paper',
                                borderColor: 'divider',
                                borderLeft: `4px solid ${borderColor}`
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                                <Typography variant="subtitle2" fontWeight={700} sx={{ color: borderColor }}>
                                    {sugg.title}
                                </Typography>
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                                {sugg.description}
                            </Typography>

                            {sugg.node && (
                                <Box>
                                    <Chip
                                        size="small"
                                        label={sugg.node}
                                        sx={{ fontFamily: monospaceFontFamily, fontSize: '0.75em' }}
                                        variant="outlined"
                                    />
                                </Box>
                            )}

                            {sugg.recommendation && (
                                sugg.recommendation.map((rec, idx) => (
                                    <Box key={idx} sx={{ mt: 4 }}>
                                        <Typography variant="caption" fontWeight={600} display="block" sx={{ color: borderColor }}>
                                            {rec.caption}:
                                        </Typography>
                                        <SyntaxHighlighter
                                            language="sql"
                                            style={atomOneDark}
                                            customStyle={{
                                                borderRadius: '4px',
                                                marginTop: 0,
                                                marginBottom: 0,
                                                fontSize: fontSize,
                                                fontFamily: monospaceFontFamily,
                                            }}
                                        >
                                            {rec.sql}
                                        </SyntaxHighlighter>
                                    </Box>
                                ))
                            )}
                        </Paper>
                    );
                })}
            </Box>
        </Box>
    );
};

