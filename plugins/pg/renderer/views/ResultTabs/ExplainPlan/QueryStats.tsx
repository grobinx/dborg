import React from 'react';
import { Box, Paper, Grid2 as Grid, Typography, useTheme, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ExplainResult, ExplainResultKind, isErrorResult, isLoadingResult, PlanNode } from './ExplainTypes';
import LoadingOverlay from '@renderer/components/useful/LoadingOverlay';
import { ExplainPlanError } from './ExplainPlanError';
import { resolveDataTypeFromValue, valueToString } from '../../../../../../src/api/db';
import Decimal from 'decimal.js';

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

export const QueryStats: React.FC<{ plan: ExplainResultKind | null }> = ({ plan }) => {
    const { t } = useTranslation();

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
            <Box sx={{ p: 4 }}>
                <Typography color="text.secondary">{t("no-explain-plan-data", "No explain plan data")}</Typography>
            </Box>
        );
    }

    const stats = calculateStats(plan);

    return (
        <Box sx={{ px: 8, py: 4, height: '100%', overflow: 'auto' }}>
            {/* Timing Section */}
            <StatSection title={t("query-stats:timing", "Timing")}>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:planning-time", "Planning Time")}
                        value={valueToString(stats.planningTime, "duration")}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:execution-time", "Execution Time")}
                        value={valueToString(stats.executionTime, "duration")}
                        variant={stats.executionTime > 100 ? 'warning' : 'default'}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:total-node-time", "Total Node Time")}
                        value={valueToString(stats.totalTime, "duration")}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:total-nodes", "Total Nodes")}
                        value={valueToString(stats.totalNodes, resolveDataTypeFromValue(stats.totalNodes))}
                    />
                </Grid>
            </StatSection>

            {/* Cost Section */}
            <StatSection title={t("query-stats:cost", "Cost & Estimation")}>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:total-cost", "Total Cost")}
                        value={valueToString(new Decimal(stats.totalCost).toFixed(2), resolveDataTypeFromValue(stats.totalCost))}
                        unit="units"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:startup-cost", "Startup Cost")}
                        value={valueToString(new Decimal(stats.totalStartupCost).toFixed(2), resolveDataTypeFromValue(stats.totalStartupCost))}
                        unit="units"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:row-estimate-error", "Row Estimate Error")}
                        value={stats.rowEstimateError !== null ? `${valueToString(new Decimal(stats.rowEstimateError).toFixed(2), resolveDataTypeFromValue(stats.rowEstimateError))}x` : 'N/A'}
                        variant={
                            stats.rowEstimateError === null ? 'default'
                                : stats.rowEstimateError > 10 ? 'error'
                                    : stats.rowEstimateError > 3 ? 'warning'
                                        : 'success'
                        }
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:cost-estimate-error", "Cost Estimate Error")}
                        value={stats.costEstimateError !== null ? `${valueToString(new Decimal(stats.costEstimateError).toFixed(2), resolveDataTypeFromValue(stats.costEstimateError))}x` : 'N/A'}
                        variant={
                            stats.costEstimateError === null ? 'default'
                                : stats.costEstimateError > 5 ? 'warning'
                                    : 'success'
                        }
                    />
                </Grid>
            </StatSection>

            {/* Scan Operations */}
            <StatSection title={t("query-stats:scans", "Scan Operations")}>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:seq-scans", "Sequential Scans")}
                        value={valueToString(stats.seqScans, resolveDataTypeFromValue(stats.seqScans))}
                        variant={stats.seqScans > 2 ? 'warning' : 'default'}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:index-scans", "Index Scans")}
                        value={valueToString(stats.indexScans, resolveDataTypeFromValue(stats.indexScans))}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:index-only-scans", "Index Only Scans")}
                        value={valueToString(stats.indexOnlyScans, resolveDataTypeFromValue(stats.indexOnlyScans))}
                        variant={stats.indexOnlyScans > 0 ? 'success' : 'default'}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:bitmap-scans", "Bitmap Scans")}
                        value={valueToString(stats.bitmapScans, resolveDataTypeFromValue(stats.bitmapScans))}
                    />
                </Grid>
            </StatSection>

            {/* Join Operations */}
            <StatSection title={t("query-stats:joins-ops", "Join Operations")}>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:total-joins", "Total Joins")}
                        value={valueToString(stats.joins, resolveDataTypeFromValue(stats.joins))}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:nested-loops", "Nested Loops")}
                        value={valueToString(stats.nestedLoops, resolveDataTypeFromValue(stats.nestedLoops))}
                        variant={stats.nestedLoops > 2 ? 'warning' : 'default'}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:hash-joins", "Hash Joins")}
                        value={valueToString(stats.hashJoins, resolveDataTypeFromValue(stats.hashJoins))}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:merge-joins", "Merge Joins")}
                        value={valueToString(stats.mergeJoins, resolveDataTypeFromValue(stats.mergeJoins))}
                    />
                </Grid>
            </StatSection>

            {/* Other Operations */}
            <StatSection title={t("query-stats:other-ops", "Other Operations")}>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:sorts", "Sorts")}
                        value={valueToString(stats.sorts, resolveDataTypeFromValue(stats.sorts))}
                        variant={stats.sorts > 1 ? 'warning' : 'default'}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:aggregates", "Aggregates")}
                        value={valueToString(stats.aggregates, resolveDataTypeFromValue(stats.aggregates))}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:materializes", "Materializes")}
                        value={valueToString(stats.materializes, resolveDataTypeFromValue(stats.materializes))}
                    />
                </Grid>
            </StatSection>

            {/* Row Processing */}
            <StatSection title={t("query-stats:rows", "Row Processing")}>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:total-rows", "Total Rows Processed")}
                        value={valueToString(stats.totalRows, resolveDataTypeFromValue(stats.totalRows))}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:max-rows-per-node", "Max Rows per Node")}
                        value={valueToString(stats.maxRowsPerNode, resolveDataTypeFromValue(stats.maxRowsPerNode))}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:rows-filtered", "Rows Filtered")}
                        value={valueToString(stats.totalRowsFiltered, resolveDataTypeFromValue(stats.totalRowsFiltered))}
                        variant={stats.totalRowsFiltered > stats.totalRows * 0.5 ? 'warning' : 'default'}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:most-expensive", "Most Expensive Node")}
                        value={stats.mostExpensiveNode?.type ?? 'N/A'}
                    />
                </Grid>
            </StatSection>

            {/* Parallel Execution */}
            {stats.parallelStats.gatherNodes > 0 && (
                <>
                    <StatSection title={t("query-stats:parallel", "Parallel Execution")}>
                        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                            <StatCard
                                label={t("query-stats:gather-nodes", "Gather Nodes")}
                                value={valueToString(stats.parallelStats.gatherNodes, resolveDataTypeFromValue(stats.parallelStats.gatherNodes))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                            <StatCard
                                label={t("query-stats:workers-planned", "Workers Planned")}
                                value={valueToString(stats.parallelStats.workersPlanned, resolveDataTypeFromValue(stats.parallelStats.workersPlanned))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                            <StatCard
                                label={t("query-stats:workers-launched", "Workers Launched")}
                                value={valueToString(stats.parallelStats.workersLaunched, resolveDataTypeFromValue(stats.parallelStats.workersLaunched))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                            <StatCard
                                label={t("query-stats:parallel-efficiency", "Parallel Efficiency")}
                                value={stats.parallelStats.efficiency !== null ?
                                    `${valueToString(stats.parallelStats.efficiency.toFixed(1), resolveDataTypeFromValue(stats.parallelStats.efficiency))}%` : 'N/A'}
                                variant={
                                    stats.parallelStats.efficiency === null ? 'default'
                                        : stats.parallelStats.efficiency >= 80 ? 'success'
                                            : 'warning'
                                }
                            />
                        </Grid>
                    </StatSection>
                </>
            )}

            {/* Buffer I/O */}
            <StatSection title={t("query-stats:buffer-io", "Buffer I/O")}>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:cache-hit-ratio", "Cache Hit Ratio")}
                        value={stats.bufferStats.cacheHitRatio !== null ?
                            valueToString(stats.bufferStats.cacheHitRatio, 'percentage') : 'N/A'}
                        variant={stats.bufferStats.cacheHitRatio !== null && stats.bufferStats.cacheHitRatio > 0.9 ? 'success' : 'warning'}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:shared-hit", "Shared Hit")}
                        value={valueToString(stats.bufferStats.sharedHitBlocks, resolveDataTypeFromValue(stats.bufferStats.sharedHitBlocks))}
                        variant="success"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:shared-read", "Shared Read")}
                        value={valueToString(stats.bufferStats.sharedReadBlocks, resolveDataTypeFromValue(stats.bufferStats.sharedReadBlocks))}
                        variant={stats.bufferStats.sharedReadBlocks > 100 ? 'warning' : 'default'}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:shared-dirtied", "Shared Dirtied")}
                        value={valueToString(stats.bufferStats.sharedDirtiedBlocks, resolveDataTypeFromValue(stats.bufferStats.sharedDirtiedBlocks))}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:shared-written", "Shared Written")}
                        value={valueToString(stats.bufferStats.sharedWrittenBlocks, resolveDataTypeFromValue(stats.bufferStats.sharedWrittenBlocks))}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:total-blocks", "Total Blocks")}
                        value={valueToString(stats.bufferStats.totalBlocks, resolveDataTypeFromValue(stats.bufferStats.totalBlocks))}
                    />
                </Grid>
            </StatSection>

            {(stats.bufferStats.localHitBlocks > 0 || stats.bufferStats.localReadBlocks > 0) && (
                <StatSection title={t("query-stats:local-buffers", "Local Buffers")}>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                        <StatCard
                            label={t("query-stats:local-hit", "Local Hit")}
                            value={valueToString(stats.bufferStats.localHitBlocks, resolveDataTypeFromValue(stats.bufferStats.localHitBlocks))}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                        <StatCard
                            label={t("query-stats:local-read", "Local Read")}
                            value={valueToString(stats.bufferStats.localReadBlocks, resolveDataTypeFromValue(stats.bufferStats.localReadBlocks))}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                        <StatCard
                            label={t("query-stats:local-dirtied", "Local Dirtied")}
                            value={valueToString(stats.bufferStats.localDirtiedBlocks, resolveDataTypeFromValue(stats.bufferStats.localDirtiedBlocks))}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                        <StatCard
                            label={t("query-stats:local-written", "Local Written")}
                            value={valueToString(stats.bufferStats.localWrittenBlocks, resolveDataTypeFromValue(stats.bufferStats.localWrittenBlocks))}
                        />
                    </Grid>
                </StatSection>
            )}

            {(stats.bufferStats.tempReadBlocks > 0 || stats.bufferStats.tempWrittenBlocks > 0) && (
                <>
                    <StatSection title={t("query-stats:temp-buffers", "Temp Buffers")}>
                        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                            <StatCard
                                label={t("query-stats:temp-read", "Temp Read")}
                                value={valueToString(stats.bufferStats.tempReadBlocks, resolveDataTypeFromValue(stats.bufferStats.tempReadBlocks))}
                                variant={stats.bufferStats.tempReadBlocks > 100 ? 'warning' : 'default'}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                            <StatCard
                                label={t("query-stats:temp-written", "Temp Written")}
                                value={valueToString(stats.bufferStats.tempWrittenBlocks, resolveDataTypeFromValue(stats.bufferStats.tempWrittenBlocks))}
                                variant={stats.bufferStats.tempWrittenBlocks > 100 ? 'warning' : 'default'}
                            />
                        </Grid>
                    </StatSection>
                </>
            )}

            {/* WAL Stats */}
            {stats.walStats && (
                <>
                    <StatSection title={t("query-stats:wal", "Write-Ahead Log (WAL)")}>
                        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                            <StatCard
                                label={t("query-stats:wal-records", "WAL Records")}
                                value={valueToString(stats.walStats.records, resolveDataTypeFromValue(stats.walStats.records))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                            <StatCard
                                label={t("query-stats:wal-fpi", "Full Page Images")}
                                value={valueToString(stats.walStats.fpi, resolveDataTypeFromValue(stats.walStats.fpi))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                            <StatCard
                                label={t("query-stats:wal-bytes", "WAL Bytes")}
                                value={valueToString(stats.walStats.bytes, resolveDataTypeFromValue(stats.walStats.bytes))}
                            />
                        </Grid>
                    </StatSection>
                </>
            )}

            {/* Memory Stats */}
            {(stats.memoryStats.sortSpaceUsed > 0 || stats.memoryStats.hashBatchesUsed > 0 || stats.memoryStats.peakMemoryUsage > 0) && (
                <>
                    <StatSection title={t("query-stats:memory", "Memory Usage")}>
                        {stats.memoryStats.sortSpaceUsed > 0 && (
                            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                                <StatCard
                                    label={t("query-stats:sort-space", "Sort Space Used")}
                                    value={valueToString(stats.memoryStats.sortSpaceUsed, resolveDataTypeFromValue(stats.memoryStats.sortSpaceUsed))}
                                />
                            </Grid>
                        )}
                        {stats.memoryStats.hashBatchesUsed > 0 && (
                            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                                <StatCard
                                    label={t("query-stats:hash-batches", "Hash Batches")}
                                    value={valueToString(stats.memoryStats.hashBatchesUsed, resolveDataTypeFromValue(stats.memoryStats.hashBatchesUsed))}
                                    variant={stats.memoryStats.hashBatchesUsed > 1 ? 'warning' : 'default'}
                                />
                            </Grid>
                        )}
                        {stats.memoryStats.peakMemoryUsage > 0 && (
                            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                                <StatCard
                                    label={t("query-stats:peak-memory", "Peak Memory")}
                                    value={valueToString(stats.memoryStats.peakMemoryUsage, resolveDataTypeFromValue(stats.memoryStats.peakMemoryUsage))}
                                />
                            </Grid>
                        )}
                    </StatSection>
                </>
            )}

            {/* JIT Stats */}
            {stats.jitStats && (
                <>
                    <StatSection title={t("query-stats:jit", "JIT Compilation")}>
                        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                            <StatCard
                                label={t("query-stats:jit-functions", "Functions")}
                                value={valueToString(stats.jitStats.functions, resolveDataTypeFromValue(stats.jitStats.functions))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                            <StatCard
                                label={t("query-stats:jit-generation", "Generation Time")}
                                value={valueToString(stats.jitStats.generationTime, "duration")}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                            <StatCard
                                label={t("query-stats:jit-inlining", "Inlining Time")}
                                value={valueToString(stats.jitStats.inliningTime, "duration")}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                            <StatCard
                                label={t("query-stats:jit-optimization", "Optimization Time")}
                                value={valueToString(stats.jitStats.optimizationTime, "duration")}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                            <StatCard
                                label={t("query-stats:jit-emission", "Emission Time")}
                                value={valueToString(stats.jitStats.emissionTime, "duration")}
                            />
                        </Grid>
                    </StatSection>
                </>
            )}

            {/* Trigger Stats */}
            {stats.triggerStats.count > 0 && (
                <>
                    <StatSection title={t("query-stats:triggers", "Triggers")}>
                        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                            <StatCard
                                label={t("query-stats:trigger-count", "Trigger Count")}
                                value={valueToString(stats.triggerStats.count, resolveDataTypeFromValue(stats.triggerStats.count))}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                            <StatCard
                                label={t("query-stats:trigger-time", "Total Trigger Time")}
                                value={valueToString(stats.triggerStats.totalTime, "duration")}
                            />
                        </Grid>
                    </StatSection>
                </>
            )}
        </Box>
    );
};