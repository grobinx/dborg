import React, { useState } from 'react';
import { Box, Typography, Paper, Chip, Collapse, Table, TableBody, TableCell, TableRow } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { formatDateTime } from '../../../../../src/api/db';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@renderer/components/buttons/IconButton';

interface PlanNode {
    'Node Type': string;
    'Startup Cost'?: number;
    'Total Cost'?: number;
    'Plan Rows'?: number;
    'Plan Width'?: number;
    'Actual Startup Time'?: number;
    'Actual Total Time'?: number;
    'Actual Rows'?: number;
    'Actual Loops'?: number;
    'Relation Name'?: string;
    'Schema'?: string;
    'Alias'?: string;
    'Join Type'?: string;
    'Hash Cond'?: string;
    'Sort Key'?: string[];
    'Filter'?: string;
    'Output'?: string[];
    'Plans'?: PlanNode[];
    [key: string]: any;
}

interface ExplainResult {
    Plan: PlanNode;
    'Planning Time'?: number;
    'Execution Time'?: number;
    [key: string]: any;
}

const formatNumber = (num: number | undefined, decimals = 3): string => {
    if (num === undefined) return '-';
    return num.toFixed(decimals);
};

const formatCost = (startup: number | undefined, total: number | undefined): string => {
    if (startup === undefined || total === undefined) return '-';
    return `${formatNumber(startup, 2)}..${formatNumber(total, 2)}`;
};

const PlanNodeComponent: React.FC<{ node: PlanNode; level: number }> = ({ node, level }) => {
    const [expanded, setExpanded] = useState(true); // mniej szumu: domyślnie tylko 2 pierwsze poziomy

    const hasChildren = Array.isArray(node.Plans) && node.Plans.length > 0;
    const hasDetails =
        Boolean(node['Hash Cond']) ||
        Boolean(node['Sort Key']) ||
        Boolean(node.Filter) ||
        (node['Rows Removed by Filter'] !== undefined && node['Rows Removed by Filter'] > 0) ||
        node['Shared Hit Blocks'] !== undefined;

    const getNodeColor = (nodeType: string): string => {
        const colors: Record<string, string> = {
            'Seq Scan': '#fb8c00',
            'Index Scan': '#43a047',
            'Index Only Scan': '#7cb342',
            'Bitmap Index Scan': '#c0ca33',
            'Bitmap Heap Scan': '#fdd835',
            'Hash Join': '#1e88e5',
            'Nested Loop': '#039be5',
            'Merge Join': '#00acc1',
            'Hash': '#00897b',
            'Sort': '#8e24aa',
            'Aggregate': '#5e35b1',
            'Limit': '#3949ab',
        };
        return colors[nodeType] || '#757575';
    };

    const nodeColor = getNodeColor(node['Node Type']);

    return (
        <Box
            sx={{
                position: 'relative',
                mb: 2,
                pl: level > 0 ? 24 : 0,
                '&::before': level > 0 ? {
                    content: '""',
                    position: 'absolute',
                    left: 8,
                    top: -8,
                    bottom: 8,
                    width: '1px',
                    bgcolor: 'divider',
                } : undefined,
                '&::after': level > 0 ? {
                    content: '""',
                    position: 'absolute',
                    left: 8,
                    top: 24,
                    width: 12,
                    height: '1px',
                    bgcolor: 'divider',
                } : undefined,
            }}
        >
            <Paper
                elevation={expanded ? 2 : 0}
                sx={{
                    px: 4,
                    py: 2,
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
                            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
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

                    {node['Join Type'] && (
                        <Chip label={node['Join Type']} size="small" variant="outlined" />
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    <Box sx={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
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
                    </Box>
                </Box>

                {hasDetails && (
                    <Collapse in={expanded}>
                        <Box sx={{ mt: 2, pl: hasChildren ? 8 : 0 }}>
                            <Table size="small">
                                <TableBody>
                                    {node['Hash Cond'] && (
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600, width: 160 }}>Hash Condition</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace' }}>
                                                {node['Hash Cond']}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {node['Sort Key'] && (
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600, width: 160 }}>Sort Key</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace' }}>
                                                {Array.isArray(node['Sort Key'])
                                                    ? node['Sort Key'].join(', ')
                                                    : String(node['Sort Key'])}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {node.Filter && (
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600, width: 160 }}>Filter</TableCell>
                                            <TableCell sx={{ fontFamily: 'monospace', wordBreak: 'break-word' }}>
                                                {node.Filter}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {node['Rows Removed by Filter'] !== undefined && node['Rows Removed by Filter'] > 0 && (
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600, width: 160 }}>Rows Removed</TableCell>
                                            <TableCell sx={{ color: 'error.main' }}>
                                                {node['Rows Removed by Filter']}
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {node['Shared Hit Blocks'] !== undefined && (
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600, width: 160 }}>Shared Blocks</TableCell>
                                            <TableCell>
                                                Hit: {node['Shared Hit Blocks']}, Read: {node['Shared Read Blocks'] ?? 0}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                )}
            </Paper>

            {expanded && hasChildren && (
                <Box sx={{ mt: 2 }}>
                    {node.Plans!.map((childNode, index) => (
                        <PlanNodeComponent key={index} node={childNode} level={level + 1} />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export const ExplainPlanViewer: React.FC<{ jsonText: string }> = ({ jsonText }) => {
    const [error, setError] = useState<string | null>(null);
    const [explainData, setExplainData] = useState<ExplainResult | null>(null);
    const { t } = useTranslation();

    React.useEffect(() => {
        try {
            const parsed = JSON.parse(jsonText);
            const data = Array.isArray(parsed) ? parsed[0] : parsed;

            // Sprawdź czy response zawiera błąd
            if (data?.error) {
                setError(data.error);
                setExplainData(null);
                return;
            }

            setExplainData(data);
            setError(null);
        } catch (e) {
            setError(`Failed to parse EXPLAIN output: ${e instanceof Error ? e.message : String(e)}`);
            setExplainData(null);
        }
    }, [jsonText]);

    if (error) {
        return (
            <Paper sx={{ p: 3, m: 2, borderLeft: '4px solid #f44336' }}>
                <Typography variant="h6" color="error" gutterBottom>
                    Error executing EXPLAIN
                </Typography>
                <Typography color="error" sx={{ fontFamily: 'monospace', }}>
                    {t("error-message", "Error Message")}: {error["message"]}
                </Typography>
                <Typography color="error" sx={{ fontFamily: 'monospace', }}>
                    {t("error-stack", "Error Stack")}: {error["stack"]}
                </Typography>
            </Paper>
        );
    }

    if (!explainData) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography color="text.secondary">No explain plan data</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            {/* Header z metrykami całkowitymi */}
            <Paper sx={{ p: 2, mb: 2, backgroundColor: 'primary.dark', color: 'primary.contrastText' }}>
                <Box sx={{ display: 'flex', gap: 8 }}>
                    {explainData['Planning Time'] !== undefined && (
                        <Box>
                            <Typography variant="caption">Planning Time</Typography>
                            <Typography variant="h6">
                                {formatDateTime(explainData['Planning Time'], "duration", {})}
                            </Typography>
                        </Box>
                    )}
                    {explainData['Execution Time'] !== undefined && (
                        <Box>
                            <Typography variant="caption">Execution Time</Typography>
                            <Typography variant="h6">
                                {formatDateTime(explainData['Execution Time'], "duration", {})}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* Drzewo planu */}
            <PlanNodeComponent node={explainData.Plan} level={0} />
        </Box>
    );
};