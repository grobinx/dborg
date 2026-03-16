import React from 'react';
import { Box, Paper, Grid2 as Grid, Typography, useTheme, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ExplainResult, ExplainResultKind, isErrorResult, isLoadingResult, PlanNode } from './ExplainTypes';
import LoadingOverlay from '@renderer/components/useful/LoadingOverlay';
import { ExplainPlanError } from './ExplainPlanError';
import { resolveDataTypeFromValue, valueToString } from '../../../../../../src/api/db';
import Decimal from 'decimal.js';
import { RichContainer, RichSection, RichStat } from '@renderer/components/RichContent';

interface QueryStats {
    // Timing
    totalNodes: number;
    planningTime: number;
    executionTime: number;
    totalTime: number;

    // Node types
    seqScans: number;
    indexScans: number;
    indexOnlyScans: number;
    bitmapScans: number;
    joins: number;
    nestedLoops: number;
    hashJoins: number;
    mergeJoins: number;
    sorts: number;
    aggregates: number;
    materializes: number;

    // Rows
    totalRows: number;
    totalRowsFiltered: number;
    maxRowsPerNode: number;

    // Cost
    totalCost: number;
    totalStartupCost: number;
    mostExpensiveNode: {
        type: string;
        cost: number;
        time: number;
        rows: number;
    } | null;

    // Estimates
    rowEstimateError: number | null;
    costEstimateError: number | null;

    // Parallel
    parallelStats: {
        workersPlanned: number;
        workersLaunched: number;
        gatherNodes: number;
        efficiency: number | null;
    };

    // Buffer I/O
    bufferStats: {
        sharedHitBlocks: number;
        sharedReadBlocks: number;
        sharedDirtiedBlocks: number;
        sharedWrittenBlocks: number;
        localHitBlocks: number;
        localReadBlocks: number;
        localDirtiedBlocks: number;
        localWrittenBlocks: number;
        tempReadBlocks: number;
        tempWrittenBlocks: number;
        totalBlocks: number;
        cacheHitRatio: number | null;
    };

    // WAL (PostgreSQL 13+)
    walStats: {
        records: number;
        fpi: number; // Full Page Images
        bytes: number;
    } | null;

    // Memory (PostgreSQL 13+)
    memoryStats: {
        sortSpaceUsed: number;
        hashBatchesUsed: number;
        peakMemoryUsage: number;
    };

    // JIT (Just-In-Time compilation)
    jitStats: {
        used: boolean;
        functions: number;
        generationTime: number;
        inliningTime: number;
        optimizationTime: number;
        emissionTime: number;
    } | null;

    // Triggers
    triggerStats: {
        count: number;
        totalTime: number;
    };
}

const calculateStats = (plan: ExplainResult): QueryStats => {
    const stats: QueryStats = {
        totalNodes: 0,
        planningTime: plan['Planning Time'] ?? 0,
        executionTime: plan['Execution Time'] ?? 0,
        totalTime: 0,

        seqScans: 0,
        indexScans: 0,
        indexOnlyScans: 0,
        bitmapScans: 0,
        joins: 0,
        nestedLoops: 0,
        hashJoins: 0,
        mergeJoins: 0,
        sorts: 0,
        aggregates: 0,
        materializes: 0,

        totalRows: 0,
        totalRowsFiltered: 0,
        maxRowsPerNode: 0,

        totalCost: 0,
        totalStartupCost: 0,
        mostExpensiveNode: null,

        rowEstimateError: null,
        costEstimateError: null,

        parallelStats: {
            workersPlanned: 0,
            workersLaunched: 0,
            gatherNodes: 0,
            efficiency: null
        },

        bufferStats: {
            sharedHitBlocks: 0,
            sharedReadBlocks: 0,
            sharedDirtiedBlocks: 0,
            sharedWrittenBlocks: 0,
            localHitBlocks: 0,
            localReadBlocks: 0,
            localDirtiedBlocks: 0,
            localWrittenBlocks: 0,
            tempReadBlocks: 0,
            tempWrittenBlocks: 0,
            totalBlocks: 0,
            cacheHitRatio: null,
        },

        walStats: null,

        memoryStats: {
            sortSpaceUsed: 0,
            hashBatchesUsed: 0,
            peakMemoryUsage: 0,
        },

        jitStats: null,

        triggerStats: {
            count: 0,
            totalTime: 0,
        }
    };

    let mostExpensive: { cost: number; type: string; time: number; rows: number } = {
        cost: 0,
        type: '',
        time: 0,
        rows: 0
    };

    const traverse = (node: PlanNode) => {
        stats.totalNodes++;

        // Node type counting
        const nodeType = node['Node Type'];
        if (nodeType === 'Seq Scan') stats.seqScans++;
        if (nodeType === 'Index Scan') stats.indexScans++;
        if (nodeType === 'Index Only Scan') stats.indexOnlyScans++;
        if (nodeType === 'Bitmap Heap Scan' || nodeType === 'Bitmap Index Scan') stats.bitmapScans++;
        if (nodeType?.includes('Join')) {
            stats.joins++;
            if (nodeType === 'Nested Loop') stats.nestedLoops++;
            if (nodeType === 'Hash Join') stats.hashJoins++;
            if (nodeType === 'Merge Join') stats.mergeJoins++;
        }
        if (nodeType === 'Sort') stats.sorts++;
        if (nodeType === 'Aggregate' || nodeType === 'HashAggregate' || nodeType === 'GroupAggregate') {
            stats.aggregates++;
        }
        if (nodeType === 'Materialize') stats.materializes++;
        if (nodeType === 'Gather' || nodeType === 'Gather Merge') {
            stats.parallelStats.gatherNodes++;
        }

        // Cost and time
        const nodeCost = node['Total Cost'] ?? 0;
        const nodeStartupCost = node['Startup Cost'] ?? 0;
        const nodeTime = node['Actual Total Time'] ?? 0;
        const actualRows = node['Actual Rows'] ?? 0;

        stats.totalCost = Math.max(stats.totalCost, nodeCost);
        stats.totalStartupCost += nodeStartupCost;
        stats.totalTime += nodeTime;

        // Track most expensive
        if (nodeCost > mostExpensive.cost) {
            mostExpensive = {
                cost: nodeCost,
                type: nodeType,
                time: nodeTime,
                rows: actualRows
            };
        }

        // Row counting
        stats.totalRows += actualRows;
        stats.maxRowsPerNode = Math.max(stats.maxRowsPerNode, actualRows);

        const rowsFiltered = node['Rows Removed by Filter'] ?? 0;
        stats.totalRowsFiltered += rowsFiltered;

        // Row estimate error
        const plannedRows = node['Plan Rows'];
        if (typeof plannedRows === 'number' && typeof actualRows === 'number') {
            const planned = Math.max(plannedRows, 1);
            const actual = Math.max(actualRows, 1);
            const factor = Math.max(actual / planned, planned / actual);
            stats.rowEstimateError = stats.rowEstimateError === null
                ? factor
                : Math.max(stats.rowEstimateError, factor);
        }

        // Cost estimate error
        if (nodeTime > 0 && nodeCost > 0) {
            const costPerMs = nodeCost / Math.max(nodeTime, 0.001);
            const avgCostPerMs = stats.totalCost / Math.max(stats.totalTime, 0.001);
            if (avgCostPerMs > 0) {
                const costError = Math.max(costPerMs / avgCostPerMs, avgCostPerMs / costPerMs);
                stats.costEstimateError = stats.costEstimateError === null
                    ? costError
                    : Math.max(stats.costEstimateError, costError);
            }
        }

        // Parallel stats
        const workersPlanned = node['Workers Planned'];
        const workersLaunched = node['Workers Launched'];
        if (typeof workersPlanned === 'number') {
            stats.parallelStats.workersPlanned += workersPlanned;
        }
        if (typeof workersLaunched === 'number') {
            stats.parallelStats.workersLaunched += workersLaunched;
        }

        // Buffer stats
        stats.bufferStats.sharedHitBlocks += node['Shared Hit Blocks'] ?? 0;
        stats.bufferStats.sharedReadBlocks += node['Shared Read Blocks'] ?? 0;
        stats.bufferStats.sharedDirtiedBlocks += node['Shared Dirtied Blocks'] ?? 0;
        stats.bufferStats.sharedWrittenBlocks += node['Shared Written Blocks'] ?? 0;
        stats.bufferStats.localHitBlocks += node['Local Hit Blocks'] ?? 0;
        stats.bufferStats.localReadBlocks += node['Local Read Blocks'] ?? 0;
        stats.bufferStats.localDirtiedBlocks += node['Local Dirtied Blocks'] ?? 0;
        stats.bufferStats.localWrittenBlocks += node['Local Written Blocks'] ?? 0;
        stats.bufferStats.tempReadBlocks += node['Temp Read Blocks'] ?? 0;
        stats.bufferStats.tempWrittenBlocks += node['Temp Written Blocks'] ?? 0;

        // WAL stats
        if (node['WAL Records'] || node['WAL FPI'] || node['WAL Bytes']) {
            if (!stats.walStats) {
                stats.walStats = { records: 0, fpi: 0, bytes: 0 };
            }
            stats.walStats.records += node['WAL Records'] ?? 0;
            stats.walStats.fpi += node['WAL FPI'] ?? 0;
            stats.walStats.bytes += node['WAL Bytes'] ?? 0;
        }

        // Memory stats
        if (node['Sort Space Used']) {
            stats.memoryStats.sortSpaceUsed = Math.max(
                stats.memoryStats.sortSpaceUsed,
                node['Sort Space Used']
            );
        }
        if (node['Hash Batches']) {
            stats.memoryStats.hashBatchesUsed = Math.max(
                stats.memoryStats.hashBatchesUsed,
                node['Hash Batches']
            );
        }
        if (node['Peak Memory Usage']) {
            stats.memoryStats.peakMemoryUsage = Math.max(
                stats.memoryStats.peakMemoryUsage,
                node['Peak Memory Usage']
            );
        }

        if (node.Plans) {
            node.Plans.forEach(child => traverse(child));
        }
    };

    traverse(plan.Plan);

    stats.mostExpensiveNode = mostExpensive.type ? mostExpensive : null;

    // Calculate total blocks and cache hit ratio
    const totalHit = stats.bufferStats.sharedHitBlocks + stats.bufferStats.localHitBlocks;
    const totalRead = stats.bufferStats.sharedReadBlocks + stats.bufferStats.localReadBlocks;
    stats.bufferStats.totalBlocks = totalHit + totalRead;

    if (stats.bufferStats.totalBlocks > 0) {
        stats.bufferStats.cacheHitRatio = totalHit / stats.bufferStats.totalBlocks;
    }

    // Calculate parallel efficiency
    if (stats.parallelStats.workersPlanned > 0) {
        stats.parallelStats.efficiency = (stats.parallelStats.workersLaunched / stats.parallelStats.workersPlanned) * 100;
    }

    // JIT stats (top-level only)
    if (plan.JIT) {
        stats.jitStats = {
            used: true,
            functions: plan.JIT['Functions'] ?? 0,
            generationTime: plan.JIT['Generation Time'] ?? 0,
            inliningTime: plan.JIT['Inlining Time'] ?? 0,
            optimizationTime: plan.JIT['Optimization Time'] ?? 0,
            emissionTime: plan.JIT['Emission Time'] ?? 0,
        };
    }

    // Trigger stats
    if (plan.Triggers) {
        stats.triggerStats.count = plan.Triggers.length;
        stats.triggerStats.totalTime = plan.Triggers.reduce(
            (sum, trigger) => sum + (trigger.Time ?? 0),
            0
        );
    }

    return stats;
};

interface StatCardProps {
    label: string;
    value: string | number;
    unit?: string;
    variant?: 'default' | 'warning' | 'success' | 'error';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, unit = '', variant = 'default' }) => {
    const theme = useTheme();

    const getColor = () => {
        switch (variant) {
            case 'warning': return theme.palette.warning.main;
            case 'error': return theme.palette.error.main;
            case 'success': return theme.palette.success.main;
            default: return theme.palette.primary.main;
        }
    };

    return (
        <Paper sx={{ px: 8, py: 4, backgroundColor: 'background.paper', height: '100%', borderLeft: `4px solid ${getColor()}` }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h6" sx={{ color: getColor(), fontWeight: 700 }}>
                    {value}
                </Typography>
                {unit && (
                    <Typography variant="body2" color="text.secondary">
                        {unit}
                    </Typography>
                )}
            </Box>
        </Paper>
    );
};

interface StatSectionProps {
    title: string;
    children: React.ReactNode;
}

const StatSection: React.FC<StatSectionProps> = ({ title, children }) => {
    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
                {title}
            </Typography>
            <Grid container spacing={4}>
                {children}
            </Grid>
        </Box>
    );
};

export const QueryStats: React.FC<{
    plan: ExplainResultKind | null;
    options?: {
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
    };
}> = ({ plan, options }) => {
    const { t } = useTranslation();

    const defaultOptions = {
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
    };

    const opts = { ...defaultOptions, ...options };

    const stats = React.useMemo(() => {
        if (plan && !isErrorResult(plan) && !isLoadingResult(plan)) {
            return calculateStats(plan);
        }
        return {} as QueryStats;
    }, [plan]);

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

    return (
        <RichContainer node={{ items: [] }}>
            <RichSection node={{ title: t("query-stats:timing", "Timing"), items: [], collapsible: true, direction: "horizontal" }}>
                <RichStat node={{ label: t("query-stats:planning-time", "Planning Time"), value: valueToString(stats.planningTime, "duration"), size: 2 }} />
                <RichStat node={{ label: t("query-stats:execution-time", "Execution Time"), value: valueToString(stats.executionTime, "duration"), severity: stats.executionTime > opts.executionTimeWarningMs ? 'warning' : undefined, size: 2 }} />
                <RichStat node={{ label: t("query-stats:total-node-time", "Total Node Time"), value: valueToString(stats.totalTime, "duration"), size: 2 }} />
                <RichStat node={{ label: t("query-stats:total-nodes", "Total Nodes"), value: valueToString(stats.totalNodes, resolveDataTypeFromValue(stats.totalNodes)), size: 2 }} />
            </RichSection>

            {/* Cost Section */}
            <RichSection node={{ title: t("query-stats:cost", "Cost & Estimation"), items: [], collapsible: true, direction: "horizontal" }}>
                <RichStat node={{ label: t("query-stats:total-cost", "Total Cost"), value: valueToString(new Decimal(stats.totalCost).toFixed(2), resolveDataTypeFromValue(stats.totalCost)), size: 2 }} />
                <RichStat node={{ label: t("query-stats:startup-cost", "Startup Cost"), value: valueToString(new Decimal(stats.totalStartupCost).toFixed(2), resolveDataTypeFromValue(stats.totalStartupCost)), size: 2 }} />
                <RichStat node={{ label: t("query-stats:row-estimate-error", "Row Estimate Error"), value: stats.rowEstimateError !== null ? `${valueToString(new Decimal(stats.rowEstimateError).toFixed(2), resolveDataTypeFromValue(stats.rowEstimateError))}x` : 'N/A', severity: stats.rowEstimateError === null ? 'default' : stats.rowEstimateError > opts.rowEstimateErrorErrorThreshold ? 'error' : stats.rowEstimateError > opts.rowEstimateErrorWarningThreshold ? 'warning' : 'success', size: 2 }} />
                <RichStat node={{ label: t("query-stats:cost-estimate-error", "Cost Estimate Error"), value: stats.costEstimateError !== null ? `${valueToString(new Decimal(stats.costEstimateError).toFixed(2), resolveDataTypeFromValue(stats.costEstimateError))}x` : 'N/A', severity: stats.costEstimateError === null ? 'default' : stats.costEstimateError > opts.costEstimateErrorWarningThreshold ? 'warning' : 'success', size: 2 }} />
            </RichSection>

            <RichSection node={{ title: t("query-stats:scans", "Scan Operations"), items: [], collapsible: true, direction: "horizontal" }}>
                <RichStat node={{ label: t("query-stats:seq-scans", "Sequential Scans"), value: valueToString(stats.seqScans, resolveDataTypeFromValue(stats.seqScans)), severity: stats.seqScans > opts.seqScanWarningCount ? 'warning' : undefined, size: 2 }} />
                <RichStat node={{ label: t("query-stats:index-scans", "Index Scans"), value: valueToString(stats.indexScans, resolveDataTypeFromValue(stats.indexScans)), size: 2 }} />
                <RichStat node={{ label: t("query-stats:index-only-scans", "Index Only Scans"), value: valueToString(stats.indexOnlyScans, resolveDataTypeFromValue(stats.indexOnlyScans)), severity: stats.indexOnlyScans > 0 ? 'success' : undefined, size: 2 }} />
                <RichStat node={{ label: t("query-stats:bitmap-scans", "Bitmap Scans"), value: valueToString(stats.bitmapScans, resolveDataTypeFromValue(stats.bitmapScans)), size: 2 }} />
            </RichSection>

            <RichSection node={{ title: t("query-stats:joins-ops", "Join Operations"), items: [], collapsible: true, direction: "horizontal" }}>
                <RichStat node={{ label: t("query-stats:total-joins", "Total Joins"), value: valueToString(stats.joins, resolveDataTypeFromValue(stats.joins)), size: 2 }} />
                <RichStat node={{ label: t("query-stats:nested-loops", "Nested Loops"), value: valueToString(stats.nestedLoops, resolveDataTypeFromValue(stats.nestedLoops)), severity: stats.nestedLoops > opts.nestedLoopWarningCount ? 'warning' : undefined, size: 2 }} />
                <RichStat node={{ label: t("query-stats:hash-joins", "Hash Joins"), value: valueToString(stats.hashJoins, resolveDataTypeFromValue(stats.hashJoins)), size: 2 }} />
                <RichStat node={{ label: t("query-stats:merge-joins", "Merge Joins"), value: valueToString(stats.mergeJoins, resolveDataTypeFromValue(stats.mergeJoins)), size: 2 }} />
            </RichSection>

            <RichSection node={{ title: t("query-stats:other-ops", "Other Operations"), items: [], collapsible: true, direction: "horizontal" }}>
                <RichStat node={{ label: t("query-stats:sorts", "Sorts"), value: valueToString(stats.sorts, resolveDataTypeFromValue(stats.sorts)), severity: stats.sorts > opts.sortWarningCount ? 'warning' : undefined, size: 2 }} />
                <RichStat node={{ label: t("query-stats:aggregates", "Aggregates"), value: valueToString(stats.aggregates, resolveDataTypeFromValue(stats.aggregates)), size: 2 }} />
                <RichStat node={{ label: t("query-stats:materializes", "Materializes"), value: valueToString(stats.materializes, resolveDataTypeFromValue(stats.materializes)), size: 2 }} />
            </RichSection>

            <RichSection node={{ title: t("query-stats:rows", "Row Processing"), items: [], collapsible: true, direction: "horizontal" }}>
                <RichStat node={{ label: t("query-stats:total-rows", "Total Rows Processed"), value: valueToString(stats.totalRows, resolveDataTypeFromValue(stats.totalRows)), size: 2 }} />
                <RichStat node={{ label: t("query-stats:max-rows-per-node", "Max Rows per Node"), value: valueToString(stats.maxRowsPerNode, resolveDataTypeFromValue(stats.maxRowsPerNode)), size: 2 }} />
                <RichStat node={{ label: t("query-stats:rows-filtered", "Rows Filtered"), value: valueToString(stats.totalRowsFiltered, resolveDataTypeFromValue(stats.totalRowsFiltered)), severity: stats.totalRowsFiltered > stats.totalRows * opts.rowsFilteredWarningRatio ? 'warning' : undefined, size: 2 }} />
                <RichStat node={{ label: t("query-stats:most-expensive", "Most Expensive Node"), value: stats.mostExpensiveNode?.type ?? 'N/A', size: 2 }} />
            </RichSection>

            {stats.parallelStats.gatherNodes > 0 && (
                <RichSection node={{ title: t("query-stats:parallel", "Parallel Execution"), items: [], collapsible: true, direction: "horizontal" }}>
                    <RichStat node={{ label: t("query-stats:gather-nodes", "Gather Nodes"), value: valueToString(stats.parallelStats.gatherNodes, resolveDataTypeFromValue(stats.parallelStats.gatherNodes)), size: 2 }} />
                    <RichStat node={{ label: t("query-stats:workers-planned", "Workers Planned"), value: valueToString(stats.parallelStats.workersPlanned, resolveDataTypeFromValue(stats.parallelStats.workersPlanned)), size: 2 }} />
                    <RichStat node={{ label: t("query-stats:workers-launched", "Workers Launched"), value: valueToString(stats.parallelStats.workersLaunched, resolveDataTypeFromValue(stats.parallelStats.workersLaunched)), size: 2 }} />
                    <RichStat node={{ label: t("query-stats:parallel-efficiency", "Parallel Efficiency"), value: stats.parallelStats.efficiency !== null ? `${valueToString(stats.parallelStats.efficiency.toFixed(1), resolveDataTypeFromValue(stats.parallelStats.efficiency))}%` : 'N/A', severity: stats.parallelStats.efficiency === null ? 'default' : stats.parallelStats.efficiency >= opts.parallelEfficiencyWarningThreshold ? 'success' : 'warning', size: 2 }} />
                </RichSection>
            )}

            <RichSection node={{ title: t("query-stats:buffer-io", "Buffer I/O"), items: [], collapsible: true, direction: "horizontal" }}>
                <RichStat node={{ label: t("query-stats:cache-hit-ratio", "Cache Hit Ratio"), value: stats.bufferStats.cacheHitRatio !== null ? valueToString(stats.bufferStats.cacheHitRatio, 'percentage') : 'N/A', severity: stats.bufferStats.cacheHitRatio !== null && stats.bufferStats.cacheHitRatio > opts.cacheHitRatioWarningThreshold ? 'success' : 'warning', size: 2 }} />
                <RichStat node={{ label: t("query-stats:shared-hit", "Shared Hit Blocks"), value: valueToString(stats.bufferStats.sharedHitBlocks, resolveDataTypeFromValue(stats.bufferStats.sharedHitBlocks)), size: 2 }} />
                <RichStat node={{ label: t("query-stats:shared-read", "Shared Read Blocks"), value: valueToString(stats.bufferStats.sharedReadBlocks, resolveDataTypeFromValue(stats.bufferStats.sharedReadBlocks)), severity: stats.bufferStats.sharedReadBlocks > opts.sharedReadBlocksWarningThreshold ? 'warning' : undefined, size: 2 }} />
                <RichStat node={{ label: t("query-stats:shared-dirtied", "Shared Dirtied Blocks"), value: valueToString(stats.bufferStats.sharedDirtiedBlocks, resolveDataTypeFromValue(stats.bufferStats.sharedDirtiedBlocks)), size: 2 }} />
                <RichStat node={{ label: t("query-stats:shared-written", "Shared Written Blocks"), value: valueToString(stats.bufferStats.sharedWrittenBlocks, resolveDataTypeFromValue(stats.bufferStats.sharedWrittenBlocks)), size: 2 }} />
                <RichStat node={{ label: t("query-stats:total-blocks", "Total Blocks"), value: valueToString(stats.bufferStats.totalBlocks, resolveDataTypeFromValue(stats.bufferStats.totalBlocks)), size: 2 }} />
            </RichSection>

            {(stats.bufferStats.localHitBlocks > 0 || stats.bufferStats.localReadBlocks > 0) && (
                <RichSection node={{ title: t("query-stats:local-buffers", "Local Buffers"), items: [], collapsible: true, direction: "horizontal" }}>
                    <RichStat node={{ label: t("query-stats:local-hit", "Local Hit Blocks"), value: valueToString(stats.bufferStats.localHitBlocks, resolveDataTypeFromValue(stats.bufferStats.localHitBlocks)), size: 2 }} />
                    <RichStat node={{ label: t("query-stats:local-read", "Local Read Blocks"), value: valueToString(stats.bufferStats.localReadBlocks, resolveDataTypeFromValue(stats.bufferStats.localReadBlocks)), size: 2 }} />
                    <RichStat node={{ label: t("query-stats:local-dirtied", "Local Dirtied Blocks"), value: valueToString(stats.bufferStats.localDirtiedBlocks, resolveDataTypeFromValue(stats.bufferStats.localDirtiedBlocks)), size: 2 }} />
                    <RichStat node={{ label: t("query-stats:local-written", "Local Written Blocks"), value: valueToString(stats.bufferStats.localWrittenBlocks, resolveDataTypeFromValue(stats.bufferStats.localWrittenBlocks)), size: 2 }} />
                </RichSection>
            )}

            {(stats.bufferStats.tempReadBlocks > 0 || stats.bufferStats.tempWrittenBlocks > 0) && (
                <RichSection node={{ title: t("query-stats:temp-buffers", "Temp Buffers"), items: [], collapsible: true, direction: "horizontal" }}>
                    <RichStat node={{ label: t("query-stats:temp-read", "Temp Read Blocks"), value: valueToString(stats.bufferStats.tempReadBlocks, resolveDataTypeFromValue(stats.bufferStats.tempReadBlocks)), severity: stats.bufferStats.tempReadBlocks > opts.tempReadBlocksWarningThreshold ? 'warning' : undefined, size: 2 }} />
                    <RichStat node={{ label: t("query-stats:temp-written", "Temp Written Blocks"), value: valueToString(stats.bufferStats.tempWrittenBlocks, resolveDataTypeFromValue(stats.bufferStats.tempWrittenBlocks)), severity: stats.bufferStats.tempWrittenBlocks > opts.tempWrittenBlocksWarningThreshold ? 'warning' : undefined, size: 2 }} />
                </RichSection>
            )}

            {stats.walStats && (
                <RichSection node={{ title: t("query-stats:wal", "Write-Ahead Log (WAL)"), items: [], collapsible: true, direction: "horizontal" }}>
                    <RichStat node={{ label: t("query-stats:wal-records", "WAL Records"), value: valueToString(stats.walStats.records, resolveDataTypeFromValue(stats.walStats.records)), size: 2 }} />
                    <RichStat node={{ label: t("query-stats:wal-fpi", "Full Page Images"), value: valueToString(stats.walStats.fpi, resolveDataTypeFromValue(stats.walStats.fpi)), size: 2 }} />
                    <RichStat node={{ label: t("query-stats:wal-bytes", "WAL Bytes"), value: valueToString(stats.walStats.bytes, resolveDataTypeFromValue(stats.walStats.bytes)), size: 2 }} />
                </RichSection>
            )}

            {(stats.memoryStats.sortSpaceUsed > 0 || stats.memoryStats.hashBatchesUsed > 0 || stats.memoryStats.peakMemoryUsage > 0) && (
                <RichSection node={{ title: t("query-stats:memory", "Memory Usage"), items: [], collapsible: true, direction: "horizontal" }}>
                    <RichStat node={{ label: t("query-stats:sort-space", "Sort Space Used"), value: valueToString(stats.memoryStats.sortSpaceUsed, resolveDataTypeFromValue(stats.memoryStats.sortSpaceUsed)), size: 2 }} />
                    <RichStat node={{ label: t("query-stats:hash-batches", "Hash Batches Used"), value: valueToString(stats.memoryStats.hashBatchesUsed, resolveDataTypeFromValue(stats.memoryStats.hashBatchesUsed)), severity: stats.memoryStats.hashBatchesUsed > opts.hashBatchesWarningThreshold ? 'warning' : undefined, size: 2 }} />
                    <RichStat node={{ label: t("query-stats:peak-memory", "Peak Memory Usage"), value: valueToString(stats.memoryStats.peakMemoryUsage, resolveDataTypeFromValue(stats.memoryStats.peakMemoryUsage)), size: 2 }} />
                </RichSection>
            )}

            {stats.jitStats && (
                <RichSection node={{ title: t("query-stats:jit", "JIT Compilation"), items: [], collapsible: true, direction: "horizontal" }}>
                    <RichStat node={{ label: t("query-stats:jit-functions", "Functions"), value: valueToString(stats.jitStats.functions, resolveDataTypeFromValue(stats.jitStats.functions)), size: 2 }} />
                    <RichStat node={{ label: t("query-stats:jit-generation", "Generation Time"), value: valueToString(stats.jitStats.generationTime, "duration"), size: 2 }} />
                    <RichStat node={{ label: t("query-stats:jit-inlining", "Inlining Time"), value: valueToString(stats.jitStats.inliningTime, "duration"), size: 2 }} />
                    <RichStat node={{ label: t("query-stats:jit-optimization", "Optimization Time"), value: valueToString(stats.jitStats.optimizationTime, "duration"), size: 2 }} />
                    <RichStat node={{ label: t("query-stats:jit-emission", "Emission Time"), value: valueToString(stats.jitStats.emissionTime, "duration"), size: 2 }} />
                </RichSection>
            )}

            {stats.triggerStats.count > 0 && (
                <RichSection node={{ title: t("query-stats:triggers", "Triggers"), items: [], collapsible: true, direction: "horizontal" }}>
                    <RichStat node={{ label: t("query-stats:trigger-count", "Trigger Count"), value: valueToString(stats.triggerStats.count, resolveDataTypeFromValue(stats.triggerStats.count)), size: 2 }} />
                    <RichStat node={{ label: t("query-stats:trigger-time", "Total Trigger Time"), value: valueToString(stats.triggerStats.totalTime, "duration"), size: 2 }} />
                </RichSection>
            )}
        </RichContainer>
    );
};