import React, { useState } from 'react';
import { Box, Typography, Paper, Chip, Collapse, Table, TableBody, TableCell, TableRow, useTheme, Link } from '@mui/material';
import { formatDateTime } from '../../../../../../src/api/db';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@renderer/components/buttons/IconButton';
import { ErrorResult, ExplainResultKind, isErrorResult, isLoadingResult, PlanNode } from './ExplainTypes';
import LoadingOverlay from '@renderer/components/useful/LoadingOverlay';
import { ExplainPlanError } from './ExplainPlanError';

const formatNumber = (num: number | undefined, decimals = 3): string => {
    if (num === undefined) return '-';
    return num.toFixed(decimals);
};

const formatCost = (startup: number | undefined, total: number | undefined): string => {
    if (startup === undefined || total === undefined) return '-';
    return `${formatNumber(startup, 2)}..${formatNumber(total, 2)}`;
};

const KNOWN_NODE_KEYS = new Set<string>([
    'Node Type',
    'Startup Cost',
    'Total Cost',
    'Plan Rows',
    'Plan Width',
    'Actual Startup Time',
    'Actual Total Time',
    'Actual Rows',
    'Actual Loops',
    'Relation Name',
    'Schema',
    'Alias',
    'Join Type',
    'Hash Cond',
    'Sort Key',
    'Filter',
    'Output',
    'Plans',
]);

const formatAnyValue = (value: unknown): string => {
    if (value === undefined || value === null) return '-';
    if (Array.isArray(value)) return value.map((v) => String(v)).join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

const PlanNodeComponent: React.FC<{ node: PlanNode; level: number }> = ({ node, level }) => {
    const [expanded, setExpanded] = useState(true);
    const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);
    const theme = useTheme();
    const { t } = useTranslation();

    const hasChildren = Array.isArray(node.Plans) && node.Plans.length > 0;

    const hasKeyDetails =
        Boolean(node['Sort Key']?.length) ||
        Boolean(node.Filter) ||
        (node['Rows Removed by Filter'] !== undefined && node['Rows Removed by Filter'] > 0);

    const additionalDetails = Object.entries(node).filter(([key, value]) =>
        !KNOWN_NODE_KEYS.has(key) &&
        key !== 'Rows Removed by Filter' &&
        value !== undefined &&
        value !== null &&
        !(Array.isArray(value) && value.length === 0)
    );

    const hasAdditionalDetails =
        Boolean(node['Hash Cond']) ||
        node['Shared Hit Blocks'] !== undefined ||
        Boolean(node.Output?.length) ||
        node['Actual Startup Time'] !== undefined ||
        additionalDetails.length > 0;

    const getNodeColor = (nodeType: string): string => {
        const critical = new Set<string>([
            'Seq Scan',
            'Nested Loop',
        ]);

        const high = new Set<string>([
            'Sort',
            'HashAggregate',
            'Aggregate',
            'Materialize',
            'Function Scan',
            'ProjectSet',
        ]);

        const medium = new Set<string>([
            'Hash Join',
            'Merge Join',
            'Bitmap Heap Scan',
            'BitmapAnd',
            'BitmapOr',
            'Hash',
            'Subquery Scan',
        ]);

        const low = new Set<string>([
            'Index Scan',
            'Index Only Scan',
            'Bitmap Index Scan',
            'Memoize',
            'Result',
            'Limit',
            'Append',
        ]);

        if (critical.has(nodeType)) return theme.palette.error.main;      // wysokie zagrożenie
        if (high.has(nodeType)) return theme.palette.warning.main;        // podwyższone
        if (medium.has(nodeType)) return theme.palette.info.main;         // umiarkowane
        if (low.has(nodeType)) return theme.palette.success.main;         // niskie

        return theme.palette.main.main; // nieznane / neutralne
    };

    const nodeColor = getNodeColor(node['Node Type']);

    return (
        <Box
            sx={{
                position: 'relative',
                mb: 0,
                pl: level > 0 ? 24 : 0,
                '&::before': level > 0 ? {
                    content: '""',
                    position: 'absolute',
                    left: 8,
                    top: -4,
                    bottom: 0,
                    width: '1px',
                    bgcolor: 'divider',
                } : undefined,
                '&::after': level > 0 ? {
                    content: '""',
                    position: 'absolute',
                    left: 8,
                    top: 16,
                    width: 12,
                    height: '1px',
                    bgcolor: 'divider',
                } : undefined,
            }}
        >
            <Paper
                elevation={expanded ? 2 : 0}
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    px: 4,
                    py: 2,
                    mb: 4,
                    border: '1px solid',
                    borderColor: expanded ? 'action.selected' : 'divider',
                    borderLeft: `4px solid ${nodeColor}`,
                    backgroundColor: expanded ? 'action.hover' : 'background.paper',
                    transition: 'all .15s ease',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {hasChildren ? (
                        <IconButton size="small" dense onClick={() => setExpanded(!expanded)} style={{ height: "100%" }}>
                            {expanded ? <theme.icons.ExpandLess /> : <theme.icons.ExpandMore />}
                        </IconButton>
                    ) : (
                        <Box sx={{ width: 24 }} />
                    )}

                    <Chip
                        label={node['Node Type']}
                        size="small"
                        sx={{
                            backgroundColor: nodeColor,
                            color: '#fff',
                            fontWeight: 700,
                        }}
                    />

                    {node['Relation Name'] && (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                            {node.Schema ? `${node.Schema}.` : ''}{node['Relation Name']}
                            {node.Alias ? ` (${node.Alias})` : ''}
                        </Typography>
                    )}

                    {node['Group Key'] && (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                            {Array.isArray(node['Group Key'])
                                ? node['Group Key'].join(', ')
                                : String(node['Group Key'])
                            }
                        </Typography>
                    )}

                    {node['Sort Key'] && (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                            {Array.isArray(node['Sort Key'])
                                ? node['Sort Key'].join(', ')
                                : String(node['Sort Key'])
                            }
                        </Typography>
                    )}

                    {node['Function Name'] && (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                            {node['Function Name']}
                        </Typography>
                    )}

                    {node['Join Type'] && (
                        <Chip label={node['Join Type']} size="small" variant="outlined" />
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    <Box sx={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {hasAdditionalDetails && (
                            <IconButton size="small" dense
                                onClick={() => setShowAdditionalDetails((prev) => !prev)} style={{ height: '100%' }}
                                tooltip={showAdditionalDetails ? t("hide-additional-details", "Hide Additional Details") : t("show-additional-details", "Show Additional Details")}
                            >
                                {showAdditionalDetails ? <theme.icons.ExpandLess /> : <theme.icons.ExpandMore />}
                            </IconButton>
                        )}

                        <Chip
                            size="small"
                            variant="outlined"
                            label={`Cost ${formatCost(node['Startup Cost'], node['Total Cost'])}`}
                            sx={{ fontFamily: 'monospace' }}
                        />

                        {node['Actual Total Time'] !== undefined && (
                            <Chip
                                size="small"
                                variant="outlined"
                                label={`Time ${formatDateTime(node['Actual Total Time'], "duration", {})}`}
                                sx={{ fontFamily: 'monospace' }}
                            />
                        )}

                        <Chip
                            size="small"
                            variant="outlined"
                            label={`Rows ${node['Actual Rows'] ?? node['Plan Rows'] ?? '-'}`}
                            sx={{ fontFamily: 'monospace' }}
                        />

                        {node['Actual Loops'] !== undefined && (
                            <Chip
                                size="small"
                                variant="outlined"
                                label={`Loops ${node['Actual Loops']}`}
                                sx={{ fontFamily: 'monospace' }}
                            />
                        )}

                        {node['Plan Width'] !== undefined && (
                            <Chip
                                size="small"
                                variant="outlined"
                                label={`Width ${node['Plan Width']}`}
                                sx={{ fontFamily: 'monospace' }}
                            />
                        )}
                    </Box>
                </Box>

                {hasKeyDetails && (
                    <Box sx={{ mt: 2, pl: hasChildren ? 8 : 0 }}>
                        <Table size="small">
                            <TableBody>
                                {node.Filter && (
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, width: 160 }}>{t("filter", "Filter")}</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', wordBreak: 'break-word' }}>
                                            {node.Filter}
                                        </TableCell>
                                    </TableRow>
                                )}

                                {node['Rows Removed by Filter'] !== undefined && node['Rows Removed by Filter'] > 0 && (
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, width: 160 }}>{t("rows-removed", "Rows Removed")}</TableCell>
                                        <TableCell sx={{ fontWeight: 600, color: 'error.main' }}>
                                            {node['Rows Removed by Filter']}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Box>
                )}

                {hasAdditionalDetails && (
                    <Box sx={{ pl: hasChildren ? 8 : 0, pt: hasKeyDetails ? 1 : 2 }}>
                        <Collapse in={showAdditionalDetails}>
                            <Box sx={{ mt: 1 }}>
                                <Table size="small">
                                    <TableBody>
                                        {node['Hash Cond'] && (
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, width: 160 }}>{t("hash-condition", "Hash Condition")}</TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace' }}>
                                                    {node['Hash Cond']}
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {node['Shared Hit Blocks'] !== undefined && (
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, width: 160 }}>{t("shared-blocks", "Shared Blocks")}</TableCell>
                                                <TableCell>
                                                    {t("hit", "Hit")}: {node['Shared Hit Blocks']}, {t("read", "Read")}: {node['Shared Read Blocks'] ?? 0}
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {node.Output && node.Output.length > 0 && (
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, width: 160 }}>{t("output", "Output")}</TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace', wordBreak: 'break-word' }}>
                                                    {node.Output.join(', ')}
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {node['Actual Startup Time'] !== undefined && (
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, width: 160 }}>{t("actual-startup", "Actual Startup")}</TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace' }}>
                                                    {formatDateTime(node['Actual Startup Time'], "duration", {})}
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {additionalDetails.map(([key, value]) => (
                                            <TableRow key={key}>
                                                <TableCell sx={{ fontWeight: 600, width: 160 }}>{key}</TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace', wordBreak: 'break-word' }}>
                                                    {formatAnyValue(value)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        </Collapse>
                    </Box>
                )}
            </Paper>

            {expanded && hasChildren && (
                <Box>
                    {node.Plans!.map((childNode, index) => (
                        <PlanNodeComponent key={index} node={childNode} level={level + 1} />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export const ExplainPlanViewer: React.FC<{ plan: ExplainResultKind | null }> = ({ plan }) => {
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
            <Box sx={{ p: 8 }}>
                <Typography color="text.secondary">{t("no-explain-plan-data", "No explain plan data")}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ px: 8, py: 4, height: '100%', overflow: 'auto' }}>
            {/* Header z metrykami całkowitymi */}
            <Paper sx={{ px: 8, py: 4, mb: 4, backgroundColor: 'primary.dark', color: 'primary.contrastText' }}>
                <Box sx={{ display: 'flex', gap: 8 }}>
                    {plan['Planning Time'] !== undefined && (
                        <Box>
                            <Typography variant="body1">{t("planning-time", "Planning Time")}</Typography>
                            <Typography variant="h6">
                                {formatDateTime(plan['Planning Time'], "duration", {})}
                            </Typography>
                        </Box>
                    )}
                    {plan['Execution Time'] !== undefined && (
                        <Box>
                            <Typography variant="body1">{t("execution-time", "Execution Time")}</Typography>
                            <Typography variant="h6">
                                {formatDateTime(plan['Execution Time'], "duration", {})}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* Drzewo planu */}
            <PlanNodeComponent node={plan.Plan} level={0} />
        </Box>
    );
};