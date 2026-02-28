import React, { useState } from 'react';
import { Box, Typography, Paper, Chip, Collapse, IconButton, Table, TableBody, TableCell, TableRow } from '@mui/material';
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { formatDateTime } from '../../../../../src/api/db';

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
    const [expanded, setExpanded] = useState(level < 2); // Automatycznie rozwiń pierwsze 2 poziomy

    const hasChildren = node.Plans && node.Plans.length > 0;
    const indent = level * 24;

    // Kolor na podstawie typu węzła
    const getNodeColor = (nodeType: string): string => {
        const colors: Record<string, string> = {
            'Seq Scan': '#ff9800',
            'Index Scan': '#4caf50',
            'Index Only Scan': '#8bc34a',
            'Bitmap Index Scan': '#cddc39',
            'Bitmap Heap Scan': '#ffeb3b',
            'Hash Join': '#2196f3',
            'Nested Loop': '#03a9f4',
            'Merge Join': '#00bcd4',
            'Hash': '#009688',
            'Sort': '#9c27b0',
            'Aggregate': '#673ab7',
            'Limit': '#3f51b5',
        };
        return colors[nodeType] || '#757575';
    };

    // Oblicz % czasu wykonania
    const getTimePercentage = (actualTime: number | undefined): string => {
        if (actualTime === undefined) return '';
        // To jest uproszczone - w prawdziwej implementacji potrzebujesz total execution time z root
        return '';
    };

    return (
        <Box sx={{ mb: 1 }}>
            <Paper
                elevation={1}
                sx={{
                    ml: `${indent}px`,
                    px: 4,
                    backgroundColor: expanded ? 'action.hover' : 'background.paper',
                    borderLeft: `4px solid ${getNodeColor(node['Node Type'])}`,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {hasChildren && (
                        <IconButton
                            size="small"
                            onClick={() => setExpanded(!expanded)}
                            sx={{ p: 0 }}
                        >
                            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                    )}
                    
                    <Chip
                        label={node['Node Type']}
                        size="small"
                        sx={{
                            backgroundColor: getNodeColor(node['Node Type']),
                            color: 'white',
                            fontWeight: 'bold',
                        }}
                    />

                    {node['Relation Name'] && (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {node.Schema && `${node.Schema}.`}{node['Relation Name']}
                            {node.Alias && ` (${node.Alias})`}
                        </Typography>
                    )}

                    {node['Join Type'] && (
                        <Chip label={node['Join Type']} size="small" variant="outlined" />
                    )}

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Metryki */}
                    <Box sx={{ display: 'flex', gap: 8, fontSize: '0.875rem' }}>
                        <Box sx={{ display: 'flex', gap: 4 }}>
                            <Typography component="span" variant="caption" color="text.secondary">Cost:</Typography>
                            <Typography component="span" variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {formatCost(node['Startup Cost'], node['Total Cost'])}
                            </Typography>
                        </Box>
                        
                        {node['Actual Total Time'] !== undefined && (
                            <Box sx={{ display: 'flex', gap: 4 }}>
                                <Typography component="span" variant="caption" color="text.secondary">Time:</Typography>
                                <Typography component="span" variant="body2" sx={{ fontFamily: 'monospace' }}>
                                    {formatDateTime(node['Actual Total Time'], "duration", {})}
                                </Typography>
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', gap: 4 }}>
                            <Typography component="span" variant="caption" color="text.secondary">Rows:</Typography>
                            <Typography component="span" variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {node['Actual Rows'] ?? node['Plan Rows'] ?? '-'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Dodatkowe szczegóły */}
                <Collapse in={expanded}>
                    <Box sx={{ mt: 1, ml: hasChildren ? 4 : 0 }}>
                        <Table size="small">
                            <TableBody>
                                {node['Hash Cond'] && (
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', width: '150px' }}>Hash Condition</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                            {node['Hash Cond']}
                                        </TableCell>
                                    </TableRow>
                                )}
                                
                                {node['Sort Key'] && (
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Sort Key</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                            {Array.isArray(node['Sort Key']) 
                                                ? node['Sort Key'].join(', ') 
                                                : node['Sort Key']}
                                        </TableCell>
                                    </TableRow>
                                )}

                                {node.Filter && (
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Filter</TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-word' }}>
                                            {node.Filter}
                                        </TableCell>
                                    </TableRow>
                                )}

                                {node['Rows Removed by Filter'] !== undefined && node['Rows Removed by Filter'] > 0 && (
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Rows Removed</TableCell>
                                        <TableCell sx={{ color: 'error.main' }}>
                                            {node['Rows Removed by Filter']}
                                        </TableCell>
                                    </TableRow>
                                )}

                                {node['Shared Hit Blocks'] !== undefined && (
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Shared Blocks</TableCell>
                                        <TableCell>
                                            Hit: {node['Shared Hit Blocks']}, Read: {node['Shared Read Blocks'] ?? 0}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </Box>
                </Collapse>
            </Paper>

            {/* Rekurencyjnie renderuj dzieci */}
            {expanded && hasChildren && (
                <Box sx={{ mt: 1 }}>
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

    React.useEffect(() => {
        try {
            const parsed = JSON.parse(jsonText);
            const data = Array.isArray(parsed) ? parsed[0] : parsed;
            setExplainData(data);
            setError(null);
        } catch (e) {
            setError(`Failed to parse EXPLAIN output: ${e}`);
            setExplainData(null);
        }
    }, [jsonText]);

    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography color="error">{error}</Typography>
            </Box>
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