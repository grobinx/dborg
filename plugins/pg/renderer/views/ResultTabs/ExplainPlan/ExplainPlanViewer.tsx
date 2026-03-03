import React, { useState } from 'react';
import { Box, Typography, Paper, Chip, Collapse, Table, TableBody, TableCell, TableRow, useTheme, Link, PaletteColor } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@renderer/components/buttons/IconButton';
import { ExplainResultKind, isErrorResult, isLoadingResult, PlanNode } from './ExplainTypes';
import LoadingOverlay from '@renderer/components/useful/LoadingOverlay';
import { ExplainPlanError } from './ExplainPlanError';
import { useSetting } from '@renderer/contexts/SettingsContext';
import { resolveDataTypeFromValue, valueToString } from '../../../../../../src/api/db';

const formatCost = (startup: number | undefined, total: number | undefined): string => {
    if (startup === undefined || total === undefined) return '-';
    return `${valueToString(startup, "decimal")}..${valueToString(total, "decimal")}`;
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

const FormattedChip: React.FC<{ label: string; value: any }> = ({ label, value }) => {
    const [monospaceFontFamily] = useSetting<string>("ui", "monospaceFontFamily");

    const formattedLabel = (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {label}
            <Typography component="span" variant="body2" sx={{ fontFamily: monospaceFontFamily, fontWeight: 600 }}>
                {valueToString(value, resolveDataTypeFromValue(value))}
            </Typography>
        </Box>
    );

    return (
        <Chip
            size="small"
            variant="outlined"
            label={formattedLabel}
            sx={{ fontFamily: monospaceFontFamily }}
        />
    );
};

const PlanNodeComponent: React.FC<{ node: PlanNode; level: number }> = ({ node, level }) => {
    const [expanded, setExpanded] = useState(true);
    const [showAdditionalDetails, setShowAdditionalDetails] = useState(false);
    const theme = useTheme();
    const { t } = useTranslation();
    const [monospaceFontFamily] = useSetting<string>("ui", "monospaceFontFamily");

    const hasChildren = Array.isArray(node.Plans) && node.Plans.length > 0;

    const hasKeyDetails =
        Boolean(node['Sort Key']?.length) ||
        Boolean(node.Filter) ||
        (node['Rows Removed by Join Filter'] !== undefined && node['Rows Removed by Join Filter'] > 0) ||
        (node['Rows Removed by Filter'] !== undefined && node['Rows Removed by Filter'] > 0);

    const additionalDetails = Object.entries(node).filter(([key, value]) =>
        !KNOWN_NODE_KEYS.has(key) &&
        key !== 'Rows Removed by Filter' &&
        key !== 'Rows Removed by Join Filter' &&
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

    const getNodeColor = (nodeType: string): PaletteColor => {
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
            'Foreign Scan',
        ]);

        const medium = new Set<string>([
            'Hash Join',
            'Merge Join',
            'Bitmap Heap Scan',
            'BitmapAnd',
            'BitmapOr',
            'Hash',
            'Subquery Scan',
            'WindowAgg',
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

        if (critical.has(nodeType)) return theme.palette.error;      // wysokie zagrożenie
        if (high.has(nodeType)) return theme.palette.warning;        // podwyższone
        if (medium.has(nodeType)) return theme.palette.info;         // umiarkowane
        if (low.has(nodeType)) return theme.palette.success;         // niskie

        return theme.palette.main; // nieznane / neutralne
    };

    const nodeColor = getNodeColor(node['Node Type']);

    const getRemovedRowsColor = (removed: number | undefined, actualRows: number | undefined): string => {
        if (removed === undefined || removed <= 0) return theme.palette.success.main;

        if (actualRows === undefined || actualRows < 0) {
            if (removed > 100000) return theme.palette.error.main;
            if (removed > 10000) return theme.palette.warning.main;
            if (removed > 1000) return theme.palette.info.main;
            return theme.palette.success.main;
        }

        const ratio = removed / Math.max(removed + actualRows, 1);

        if (ratio >= 0.9) return theme.palette.error.main;
        if (ratio >= 0.6) return theme.palette.warning.main;
        if (ratio >= 0.3) return theme.palette.info.main;
        return theme.palette.success.main;
    };

    const formatRemovedRows = (removed: number | undefined, actualRows: number | undefined): string => {
        if (removed === undefined) return '-';
        const ratio = actualRows !== undefined && actualRows >= 0
            ? (removed / Math.max(removed + actualRows, 1)) * 100
            : null;

        return ratio === null ? `${valueToString(removed, "bigint")}` : `${valueToString(removed, "bigint")} (${ratio.toFixed(1)}%)`;
    };

    const removedByFilterColor = getRemovedRowsColor(node['Rows Removed by Filter'], node['Actual Rows']);
    const removedByJoinFilterColor = getRemovedRowsColor(node['Rows Removed by Join Filter'], node['Actual Rows']);

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
                    borderLeft: `4px solid ${nodeColor.main}`,
                    backgroundColor: expanded ? 'action.hover' : 'background.paper',
                    transition: 'all .15s ease',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {hasChildren ? (
                        <IconButton size="small" dense onClick={() => setExpanded(!expanded)} style={{ height: "100%" }} tooltip={expanded ? t("collapse-node", "Collapse Node") : t("expand-node", "Expand Node")}>
                            {expanded ? <theme.icons.ExpandLess /> : <theme.icons.ExpandMore />}
                        </IconButton>
                    ) : (
                        <Box sx={{ width: 24 }} />
                    )}

                    <Chip
                        label={node['Node Type']}
                        size="small"
                        sx={{
                            backgroundColor: nodeColor.main,
                            color: nodeColor.contrastText,
                            fontWeight: 700,
                        }}
                    />

                    {node['Relation Name'] && (
                        <Typography variant="body2" sx={{ fontFamily: monospaceFontFamily, color: 'text.secondary' }}>
                            {node.Schema ? `${node.Schema}.` : ''}{node['Relation Name']}
                            {node.Alias ? ` (${node.Alias})` : ''}
                        </Typography>
                    )}

                    {node['Group Key'] && (
                        <Typography variant="body2" sx={{ fontFamily: monospaceFontFamily, color: 'text.secondary' }}>
                            {Array.isArray(node['Group Key'])
                                ? node['Group Key'].join(', ')
                                : String(node['Group Key'])
                            }
                        </Typography>
                    )}

                    {node['Sort Key'] && (
                        <Typography variant="body2" sx={{ fontFamily: monospaceFontFamily, color: 'text.secondary' }}>
                            {Array.isArray(node['Sort Key'])
                                ? node['Sort Key'].join(', ')
                                : String(node['Sort Key'])
                            }
                        </Typography>
                    )}

                    {node['Function Name'] && (
                        <Typography variant="body2" sx={{ fontFamily: monospaceFontFamily, color: 'text.secondary' }}>
                            {node['Function Name']}
                        </Typography>
                    )}

                    {node['Join Type'] && (
                        <Chip label={node['Join Type']} size="small" variant="outlined" color="warning" />
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

                        <FormattedChip
                            label={t("cost", "Cost")}
                            value={formatCost(node['Startup Cost'], node['Total Cost'])}
                        />

                        {node['Actual Total Time'] !== undefined && (
                            <FormattedChip
                                label={t("time", "Time")}
                                value={valueToString(node['Actual Total Time'], "duration")}
                            />
                        )}

                        <FormattedChip
                            label={t("rows", "Rows")}
                            value={node['Actual Rows'] ?? node['Plan Rows'] ?? '-'}
                        />

                        {node['Actual Loops'] !== undefined && (
                            <FormattedChip
                                label={t("loops", "Loops")}
                                value={node['Actual Loops']}
                            />
                        )}

                        {node['Plan Width'] !== undefined && (
                            <FormattedChip
                                label={t("width", "Width")}
                                value={node['Plan Width']}
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
                                        <TableCell sx={{ fontWeight: 600, width: "15%" }}>{t("filter", "Filter")}</TableCell>
                                        <TableCell sx={{ fontFamily: monospaceFontFamily, fontSize: '0.875em', wordBreak: 'break-word' }}>
                                            {node.Filter}
                                        </TableCell>
                                    </TableRow>
                                )}

                                {node['Rows Removed by Filter'] !== undefined && node['Rows Removed by Filter'] > 0 && (
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, width: "15%" }}>
                                            {t("rows-removed-filter", "Rows Removed by Filter")}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                fontWeight: 600,
                                                color: removedByFilterColor,
                                                fontFamily: monospaceFontFamily,
                                                fontSize: '0.875em',
                                            }}
                                        >
                                            {formatRemovedRows(node['Rows Removed by Filter'], node['Actual Rows'])}
                                        </TableCell>
                                    </TableRow>
                                )}

                                {node['Rows Removed by Join Filter'] !== undefined && node['Rows Removed by Join Filter'] > 0 && (
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, width: "15%" }}>
                                            {t("rows-removed-join", "Rows Removed by Join Filter")}
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                fontWeight: 600,
                                                color: removedByJoinFilterColor,
                                                fontFamily: monospaceFontFamily,
                                                fontSize: '0.875em',
                                            }}
                                        >
                                            {formatRemovedRows(node['Rows Removed by Join Filter'], node['Actual Rows'])}
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
                                                <TableCell sx={{ fontWeight: 600, width: "15%" }}>{t("hash-condition", "Hash Condition")}</TableCell>
                                                <TableCell sx={{ fontFamily: monospaceFontFamily, fontSize: '0.875em' }}>
                                                    {node['Hash Cond']}
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {node['Shared Hit Blocks'] !== undefined && (
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, width: "15%" }}>{t("shared-blocks", "Shared Blocks")}</TableCell>
                                                <TableCell sx={{ fontFamily: monospaceFontFamily, fontSize: '0.875em' }}>
                                                    {t("hit", "Hit")}: {node['Shared Hit Blocks']}, {t("read", "Read")}: {node['Shared Read Blocks'] ?? 0}
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {node.Output && node.Output.length > 0 && (
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, width: "15%" }}>{t("output", "Output")}</TableCell>
                                                <TableCell sx={{ fontFamily: monospaceFontFamily, fontSize: '0.875em', wordBreak: 'break-word' }}>
                                                    {node.Output.join(', ')}
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {node['Actual Startup Time'] !== undefined && (
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, width: "15%" }}>{t("actual-startup", "Actual Startup")}</TableCell>
                                                <TableCell sx={{ fontFamily: monospaceFontFamily, fontSize: '0.875em' }}>
                                                    {valueToString(node['Actual Startup Time'], "duration")}
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {node['Actual Rows'] !== undefined && (
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, width: "15%" }}>{t("actual-rows", "Actual Rows")}</TableCell>
                                                <TableCell sx={{ fontFamily: monospaceFontFamily, fontSize: '0.875em' }}>
                                                    {node['Actual Rows']}
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {additionalDetails.map(([key, value]) => (
                                            <TableRow key={key}>
                                                <TableCell sx={{ fontWeight: 600, width: "15%" }}>{key}</TableCell>
                                                <TableCell sx={{ fontFamily: monospaceFontFamily, fontSize: '0.875em', wordBreak: 'break-word' }}>
                                                    {valueToString(value, resolveDataTypeFromValue(value))}
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

export const ExplainPlanViewer: React.FC<{ 
    plan: ExplainResultKind | null;
    options?: {
        removedRowsWarningThreshold: number;
        removedRowsErrorThreshold: number;
    };
}> = ({ plan, options }) => {
    const { t } = useTranslation();

    const defaultOptions = {
        removedRowsWarningThreshold: 0.3,
        removedRowsErrorThreshold: 0.6,
    };

    const opts = { ...defaultOptions, ...options };

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
                                {valueToString(plan['Planning Time'], "duration")}
                            </Typography>
                        </Box>
                    )}
                    {plan['Execution Time'] !== undefined && (
                        <Box>
                            <Typography variant="body1">{t("execution-time", "Execution Time")}</Typography>
                            <Typography variant="h6">
                                {valueToString(plan['Execution Time'], "duration")}
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