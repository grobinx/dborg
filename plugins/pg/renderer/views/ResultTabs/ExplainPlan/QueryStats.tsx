import React from 'react';
import { Box, Paper, Grid2 as Grid, Typography, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PlanNode, ExplainResult, ErrorResult, isErrorResult, ExplainPlanError } from './ExplainPlanViewer';

interface QueryStats {
    totalNodes: number;
    seqScans: number;
    indexScans: number;
    joins: number;
    sorts: number;
    aggregates: number;
    totalRows: number;
    totalCost: number;
    totalTime: number;
    planningTime: number;
    executionTime: number;
    mostExpensiveNode: {
        type: string;
        cost: number;
        time: number;
    } | null;
    rowEstimateError: number | null; // max multiplicative error, e.g. 12.4x
    parallelStats: {
        workersPlanned: number;
        workersLaunched: number;
        gatherNodes: number;
        efficiency: number | null; // %
    };
    bufferStats: {
        sharedHitBlocks: number;
        sharedReadBlocks: number;
        totalBlocks: number;
    };
}

const calculateStats = (plan: ExplainResult): QueryStats => {
    const stats: QueryStats = {
        totalNodes: 0,
        seqScans: 0,
        indexScans: 0,
        joins: 0,
        sorts: 0,
        aggregates: 0,
        totalRows: 0,
        totalCost: 0,
        totalTime: 0,
        planningTime: plan['Planning Time'] ?? 0,
        executionTime: plan['Execution Time'] ?? 0,
        mostExpensiveNode: null,
        rowEstimateError: null,
        parallelStats: {
            workersPlanned: 0,
            workersLaunched: 0,
            gatherNodes: 0,
            efficiency: null
        },
        bufferStats: {
            sharedHitBlocks: plan.Settings?.['Shared Hit Blocks'] ?? 0,
            sharedReadBlocks: plan.Settings?.['Shared Read Blocks'] ?? 0,
            totalBlocks: 0,
        }
    };

    let mostExpensive: { cost: number; type: string; time: number } = { cost: 0, type: '', time: 0 };

    const traverse = (node: PlanNode) => {
        stats.totalNodes++;

        // Node type counting
        if (node['Node Type'] === 'Seq Scan') stats.seqScans++;
        if (node['Node Type']?.includes('Index Scan')) stats.indexScans++;
        if (node['Node Type']?.includes('Join')) stats.joins++;
        if (node['Node Type'] === 'Sort') stats.sorts++;
        if (node['Node Type'] === 'Aggregate') stats.aggregates++;
        if (node['Node Type'] === 'Gather' || node['Node Type'] === 'Gather Merge') {
            stats.parallelStats.gatherNodes++;
        }

        // Cost and time
        const nodeCost = node['Total Cost'] ?? 0;
        const nodeTime = node['Actual Total Time'] ?? 0;
        stats.totalCost = Math.max(stats.totalCost, nodeCost);
        stats.totalTime += nodeTime;

        // Track most expensive
        if (nodeCost > mostExpensive.cost) {
            mostExpensive = {
                cost: nodeCost,
                type: node['Node Type'],
                time: nodeTime
            };
        }

        // Row counting
        stats.totalRows += node['Actual Rows'] ?? node['Plan Rows'] ?? 0;

        // Row estimate error (max factor across nodes)
        const plannedRows = node['Plan Rows'];
        const actualRows = node['Actual Rows'];
        if (typeof plannedRows === 'number' && typeof actualRows === 'number') {
            const planned = Math.max(plannedRows, 1);
            const actual = Math.max(actualRows, 1);
            const factor = Math.max(actual / planned, planned / actual);
            stats.rowEstimateError = stats.rowEstimateError === null
                ? factor
                : Math.max(stats.rowEstimateError, factor);
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
        if (node['Shared Hit Blocks']) {
            stats.bufferStats.sharedHitBlocks += node['Shared Hit Blocks'];
        }
        if (node['Shared Read Blocks']) {
            stats.bufferStats.sharedReadBlocks += node['Shared Read Blocks'];
        }

        if (node.Plans) {
            node.Plans.forEach(child => traverse(child));
        }
    };

    traverse(plan.Plan);

    stats.mostExpensiveNode = mostExpensive.type ? mostExpensive : null;
    stats.bufferStats.totalBlocks = stats.bufferStats.sharedHitBlocks + stats.bufferStats.sharedReadBlocks;

    if (stats.parallelStats.workersPlanned > 0) {
        stats.parallelStats.efficiency = (stats.parallelStats.workersLaunched / stats.parallelStats.workersPlanned) * 100;
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
        <Paper sx={{ p: 3, backgroundColor: 'background.paper' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                {label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h5" sx={{ color: getColor(), fontWeight: 700 }}>
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

export const QueryStats: React.FC<{ plan: ExplainResult | ErrorResult | null }> = ({ plan }) => {
    const { t } = useTranslation();
    const theme = useTheme();

    if (isErrorResult(plan)) {
        return <ExplainPlanError error={plan} />;
    }

    if (!plan) {
        return (
            <Box sx={{ p: 4 }}>
                <Typography color="text.secondary">{t("no-explain-plan-data", "No explain plan data")}</Typography>
            </Box>
        );
    }

    const stats = calculateStats(plan);
    const cacheHitRatio = stats.bufferStats.totalBlocks > 0
        ? ((stats.bufferStats.sharedHitBlocks / stats.bufferStats.totalBlocks) * 100).toFixed(1)
        : 'N/A';

    const parallelEfficiency = stats.parallelStats.efficiency !== null
        ? stats.parallelStats.efficiency.toFixed(1)
        : 'N/A';

    const rowEstimateErrorLabel = stats.rowEstimateError !== null
        ? `${stats.rowEstimateError.toFixed(1)}x`
        : 'N/A';

    return (
        <Box sx={{ px: 8, py: 4, height: '100%', overflow: 'auto' }}>
            <Paper sx={{ px: 4, py: 3, mb: 3, backgroundColor: 'action.hover', borderLeft: `4px solid ${theme.palette.primary.main}` }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {t("query-stats:title", "Query Statistics")}
                </Typography>
            </Paper>

            <Grid container spacing={3}>
                {/* Timing */}
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:planning-time", "Planning Time")}
                        value={stats.planningTime.toFixed(2)}
                        unit="ms"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:execution-time", "Execution Time")}
                        value={stats.executionTime.toFixed(2)}
                        unit="ms"
                        variant={stats.executionTime > 100 ? 'warning' : 'default'}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:total-node-time", "Total Node Time")}
                        value={stats.totalTime.toFixed(2)}
                        unit="ms"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:total-cost", "Total Cost")}
                        value={stats.totalCost.toFixed(2)}
                        unit="units"
                    />
                </Grid>

                {/* Plan composition */}
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:total-nodes", "Total Nodes")}
                        value={stats.totalNodes}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:seq-scans", "Sequential Scans")}
                        value={stats.seqScans}
                        variant={stats.seqScans > 2 ? 'warning' : 'default'}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:index-scans", "Index Scans")}
                        value={stats.indexScans}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:joins", "Joins")}
                        value={stats.joins}
                    />
                </Grid>

                {/* Operations */}
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:sorts", "Sorts")}
                        value={stats.sorts}
                        variant={stats.sorts > 1 ? 'warning' : 'default'}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:aggregates", "Aggregates")}
                        value={stats.aggregates}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:total-rows", "Total Rows Processed")}
                        value={stats.totalRows}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:most-expensive", "Most Expensive Node")}
                        value={stats.mostExpensiveNode?.type ?? 'N/A'}
                    />
                </Grid>

                {/* New stats */}
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:row-estimate-error", "Row Estimate Error (max)")}
                        value={rowEstimateErrorLabel}
                        variant={
                            stats.rowEstimateError === null
                                ? 'default'
                                : stats.rowEstimateError > 10
                                    ? 'error'
                                    : stats.rowEstimateError > 3
                                        ? 'warning'
                                        : 'success'
                        }
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:parallel-efficiency", "Parallel Efficiency")}
                        value={parallelEfficiency}
                        unit="%"
                        variant={
                            stats.parallelStats.efficiency === null
                                ? 'default'
                                : stats.parallelStats.efficiency >= 80
                                    ? 'success'
                                    : 'warning'
                        }
                    />
                </Grid>

                {/* Buffer stats */}
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:cache-hit-ratio", "Cache Hit Ratio")}
                        value={cacheHitRatio}
                        unit="%"
                        variant={Number(cacheHitRatio) > 90 ? 'success' : 'warning'}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:shared-hit-blocks", "Shared Hit Blocks")}
                        value={stats.bufferStats.sharedHitBlocks}
                        variant="success"
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:shared-read-blocks", "Disk Read Blocks")}
                        value={stats.bufferStats.sharedReadBlocks}
                        variant={stats.bufferStats.sharedReadBlocks > 100 ? 'warning' : 'default'}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4, md: 2 }}>
                    <StatCard
                        label={t("query-stats:total-blocks", "Total Blocks")}
                        value={stats.bufferStats.totalBlocks}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};