import React, { useMemo } from "react";
import { Box, Chip, Grid2 as Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import LoadingOverlay from "@renderer/components/useful/LoadingOverlay";
import { ExplainPlanError } from "./ExplainPlanError";
import { ExplainResult, ExplainResultKind, isErrorResult, isLoadingResult, PlanNode } from "./ExplainTypes";
import { valueToString } from "../../../../../../src/api/db";

type ObjectType = "table" | "function" | "cte";

interface ObjectStats {
    key: string;
    type: ObjectType;
    schema?: string;
    name: string;
    aliases: Set<string>;
    nodeCount: number;
    totalTime: number;
    totalCost: number;
    totalRows: number;
    sharedReadBlocks: number;
    sharedHitBlocks: number;
    seqScans: number;
    indexScans: number;
    indexOnlyScans: number;
    bitmapScans: number;
    estimatedCalls: number;
    nodeTypes: Set<string>;
    levels: Set<number>;
}

interface TableCoverage {
    key: string;
    schema?: string;
    name: string;
    seqScans: number;
    indexScans: number;
    indexOnlyScans: number;
    bitmapScans: number;
    totalScans: number;
    indexCoverage: number | null;
}

interface FunctionRisk {
    key: string;
    name: string;
    totalTime: number;
    estimatedCalls: number;
    sharedReadBlocks: number;
    risk: "low" | "medium" | "high";
    reasons: string[];
}

const n = (v: any): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);

const upsert = (map: Map<string, ObjectStats>, key: string, init: Omit<ObjectStats, "aliases" | "nodeTypes" | "levels">): ObjectStats => {
    const existing = map.get(key);
    if (existing) return existing;

    const created: ObjectStats = {
        ...init,
        aliases: new Set<string>(),
        nodeTypes: new Set<string>(),
        levels: new Set<number>(),
    };
    map.set(key, created);
    return created;
};

const collect = (plan: ExplainResult) => {
    const map = new Map<string, ObjectStats>();

    const walk = (node: PlanNode, level = 0) => {
        const nodeType = String(node["Node Type"] ?? "Unknown");
        const totalTime = n(node["Actual Total Time"]);
        const totalCost = n(node["Total Cost"]);
        const totalRows = n(node["Actual Rows"] ?? node["Plan Rows"]);
        const sharedReadBlocks = n(node["Shared Read Blocks"]);
        const sharedHitBlocks = n(node["Shared Hit Blocks"]);
        const loops = Math.max(1, n(node["Actual Loops"]) || 1);

        const rel = node["Relation Name"];
        if (typeof rel === "string" && rel.length > 0) {
            const schema = typeof node["Schema"] === "string" && node["Schema"].length > 0 ? node["Schema"] : "public";
            const key = `table:${schema}.${rel}`;
            const obj = upsert(map, key, {
                key,
                type: "table",
                schema,
                name: rel,
                nodeCount: 0,
                totalTime: 0,
                totalCost: 0,
                totalRows: 0,
                sharedReadBlocks: 0,
                sharedHitBlocks: 0,
                seqScans: 0,
                indexScans: 0,
                indexOnlyScans: 0,
                bitmapScans: 0,
                estimatedCalls: 0,
            });

            obj.nodeCount += 1;
            obj.totalTime += totalTime;
            obj.totalCost += totalCost;
            obj.totalRows += totalRows;
            obj.sharedReadBlocks += sharedReadBlocks;
            obj.sharedHitBlocks += sharedHitBlocks;
            obj.nodeTypes.add(nodeType);
            obj.levels.add(level);

            if (typeof node["Alias"] === "string" && node["Alias"] && node["Alias"] !== rel) {
                obj.aliases.add(node["Alias"]);
            }

            if (nodeType === "Seq Scan") obj.seqScans += 1;
            if (nodeType === "Index Scan") obj.indexScans += 1;
            if (nodeType === "Index Only Scan") obj.indexOnlyScans += 1;
            if (nodeType === "Bitmap Heap Scan" || nodeType === "Bitmap Index Scan") obj.bitmapScans += 1;
        }

        const fn = node["Function Name"];
        if (typeof fn === "string" && fn.length > 0) {
            const key = `function:${fn}`;
            const obj = upsert(map, key, {
                key,
                type: "function",
                name: fn,
                nodeCount: 0,
                totalTime: 0,
                totalCost: 0,
                totalRows: 0,
                sharedReadBlocks: 0,
                sharedHitBlocks: 0,
                seqScans: 0,
                indexScans: 0,
                indexOnlyScans: 0,
                bitmapScans: 0,
                estimatedCalls: 0,
            });

            obj.nodeCount += 1;
            obj.totalTime += totalTime;
            obj.totalCost += totalCost;
            obj.totalRows += totalRows;
            obj.sharedReadBlocks += sharedReadBlocks;
            obj.sharedHitBlocks += sharedHitBlocks;
            obj.estimatedCalls += loops * Math.max(1, totalRows || 1);
            obj.nodeTypes.add(nodeType);
            obj.levels.add(level);
        }

        const cte = node["CTE Name"];
        if (typeof cte === "string" && cte.length > 0) {
            const key = `cte:${cte}`;
            const obj = upsert(map, key, {
                key,
                type: "cte",
                name: cte,
                nodeCount: 0,
                totalTime: 0,
                totalCost: 0,
                totalRows: 0,
                sharedReadBlocks: 0,
                sharedHitBlocks: 0,
                seqScans: 0,
                indexScans: 0,
                indexOnlyScans: 0,
                bitmapScans: 0,
                estimatedCalls: 0,
            });

            obj.nodeCount += 1;
            obj.totalTime += totalTime;
            obj.totalCost += totalCost;
            obj.totalRows += totalRows;
            obj.sharedReadBlocks += sharedReadBlocks;
            obj.sharedHitBlocks += sharedHitBlocks;
            obj.nodeTypes.add(nodeType);
            obj.levels.add(level);
        }

        if (Array.isArray(node.Plans)) {
            node.Plans.forEach((p) => walk(p, level + 1));
        }
    };

    walk(plan.Plan);

    const objects = Array.from(map.values());

    const hotspots = [...objects].sort((a, b) =>
        b.totalTime - a.totalTime ||
        b.sharedReadBlocks - a.sharedReadBlocks ||
        b.totalCost - a.totalCost
    );

    const tableCoverage: TableCoverage[] = objects
        .filter((o) => o.type === "table")
        .map((o) => {
            const totalScans = o.seqScans + o.indexScans + o.indexOnlyScans + o.bitmapScans;
            const indexCoverage = totalScans > 0 ? (o.indexScans + o.indexOnlyScans + o.bitmapScans) / totalScans : null;
            return {
                key: o.key,
                schema: o.schema,
                name: o.name,
                seqScans: o.seqScans,
                indexScans: o.indexScans,
                indexOnlyScans: o.indexOnlyScans,
                bitmapScans: o.bitmapScans,
                totalScans,
                indexCoverage,
            };
        })
        .sort((a, b) => {
            const av = a.indexCoverage ?? -1;
            const bv = b.indexCoverage ?? -1;
            return av - bv;
        });

    const functionRisks: FunctionRisk[] = objects
        .filter((o) => o.type === "function")
        .map((o) => {
            const reasons: string[] = [];
            if (o.totalTime > 100) reasons.push("High total time");
            if (o.estimatedCalls > 10000) reasons.push("Very high estimated call count");
            if (o.sharedReadBlocks > 100) reasons.push("High disk reads");
            const risk: FunctionRisk["risk"] =
                reasons.length >= 2 ? "high" : reasons.length === 1 ? "medium" : "low";

            return {
                key: o.key,
                name: o.name,
                totalTime: o.totalTime,
                estimatedCalls: o.estimatedCalls,
                sharedReadBlocks: o.sharedReadBlocks,
                risk,
                reasons,
            };
        })
        .sort((a, b) => {
            const rank = { high: 3, medium: 2, low: 1 };
            return rank[b.risk] - rank[a.risk] || b.totalTime - a.totalTime;
        });

    return { objects, hotspots, tableCoverage, functionRisks };
};

const riskColor = (risk: "low" | "medium" | "high"): "success" | "warning" | "error" =>
    risk === "high" ? "error" : risk === "medium" ? "warning" : "success";

export const UsedObjects: React.FC<{ 
    plan: ExplainResultKind | null;
    options?: {
        functionRiskHighTime: number;
        functionRiskHighCalls: number;
        functionRiskHighReads: number;
    };
}> = ({ plan, options }) => {
    const { t } = useTranslation();

    const defaultOptions = {
        functionRiskHighTime: 100,
        functionRiskHighCalls: 10000,
        functionRiskHighReads: 100,
    };

    const opts = { ...defaultOptions, ...options };

    const data = useMemo(() => {
        if (!plan || isErrorResult(plan) || isLoadingResult(plan)) return null;
        
        // Modify collect function inline
        const collectWithOptions = (planData: ExplainResult) => {
            const result = collect(planData);
            
            // Recalculate function risks with custom thresholds
            result.functionRisks = result.objects
                .filter((o) => o.type === "function")
                .map((o) => {
                    const reasons: string[] = [];
                    if (o.totalTime > opts.functionRiskHighTime) reasons.push("High total time");
                    if (o.estimatedCalls > opts.functionRiskHighCalls) reasons.push("Very high estimated call count");
                    if (o.sharedReadBlocks > opts.functionRiskHighReads) reasons.push("High disk reads");
                    const risk: FunctionRisk["risk"] =
                        reasons.length >= 2 ? "high" : reasons.length === 1 ? "medium" : "low";

                    return {
                        key: o.key,
                        name: o.name,
                        totalTime: o.totalTime,
                        estimatedCalls: o.estimatedCalls,
                        sharedReadBlocks: o.sharedReadBlocks,
                        risk,
                        reasons,
                    };
                })
                .sort((a, b) => {
                    const rank = { high: 3, medium: 2, low: 1 };
                    return rank[b.risk] - rank[a.risk] || b.totalTime - a.totalTime;
                });

            return result;
        };

        return collectWithOptions(plan);
    }, [plan, opts]);

    if (isErrorResult(plan)) {
        return <ExplainPlanError error={plan} />;
    }

    if (isLoadingResult(plan)) {
        return <LoadingOverlay label={plan.loading.message} onCancelLoading={plan.loading.cancel} />;
    }

    if (!plan || !data) {
        return (
            <Box sx={{ p: 8 }}>
                <Typography color="text.secondary">{t("no-explain-plan-data", "No explain plan data")}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ px: 8, py: 4, height: "100%", overflow: "auto" }}>
            <Grid container spacing={4}>
                <Grid size={{ xs: 12 }}>
                    <Paper sx={{ p: 4 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>{t("used-objects", "Used Objects")}</Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t("object", "Object")}</TableCell>
                                    <TableCell>{t("type", "Type")}</TableCell>
                                    <TableCell align="right">{t("nodes", "Nodes")}</TableCell>
                                    <TableCell align="right">{t("time", "Time")}</TableCell>
                                    <TableCell align="right">{t("cost", "Cost")}</TableCell>
                                    <TableCell align="right">{t("rows", "Rows")}</TableCell>
                                    <TableCell align="right">{t("reads", "Reads")}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.objects.map((o) => (
                                    <TableRow key={o.key}>
                                        <TableCell>{o.schema ? `${o.schema}.${o.name}` : o.name}</TableCell>
                                        <TableCell>{o.type}</TableCell>
                                        <TableCell align="right">{o.nodeCount}</TableCell>
                                        <TableCell align="right">{valueToString(o.totalTime, "duration")}</TableCell>
                                        <TableCell align="right">{valueToString(o.totalCost, "decimal")}</TableCell>
                                        <TableCell align="right">{valueToString(o.totalRows, "quantity")}</TableCell>
                                        <TableCell align="right">{valueToString(o.sharedReadBlocks, "quantity")}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 6 }}>
                    <Paper sx={{ p: 4, height: "100%" }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>{t("hotspot-ranking", "Hotspot ranking per object")}</Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>#</TableCell>
                                    <TableCell>{t("object", "Object")}</TableCell>
                                    <TableCell align="right">{t("time", "Time")}</TableCell>
                                    <TableCell align="right">{t("reads", "Reads")}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.hotspots.slice(0, 15).map((o, i) => (
                                    <TableRow key={o.key}>
                                        <TableCell>{i + 1}</TableCell>
                                        <TableCell>{o.schema ? `${o.schema}.${o.name}` : o.name}</TableCell>
                                        <TableCell align="right">{valueToString(o.totalTime, "duration")}</TableCell>
                                        <TableCell align="right">{valueToString(o.sharedReadBlocks, "quantity")}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 6 }}>
                    <Paper sx={{ p: 4, height: "100%" }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>{t("index-coverage", "Index coverage on tables")}</Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t("table", "Table")}</TableCell>
                                    <TableCell align="right">Seq</TableCell>
                                    <TableCell align="right">Idx</TableCell>
                                    <TableCell align="right">IdxOnly</TableCell>
                                    <TableCell align="right">Bitmap</TableCell>
                                    <TableCell align="right">{t("coverage", "Coverage")}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.tableCoverage.map((tRow) => (
                                    <TableRow key={tRow.key}>
                                        <TableCell>{tRow.schema ? `${tRow.schema}.${tRow.name}` : tRow.name}</TableCell>
                                        <TableCell align="right">{tRow.seqScans}</TableCell>
                                        <TableCell align="right">{tRow.indexScans}</TableCell>
                                        <TableCell align="right">{tRow.indexOnlyScans}</TableCell>
                                        <TableCell align="right">{tRow.bitmapScans}</TableCell>
                                        <TableCell align="right">
                                            {tRow.indexCoverage === null ? "N/A" : valueToString(tRow.indexCoverage, "percentage")}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 6 }}>
                    <Paper sx={{ p: 4, height: "100%" }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>{t("function-risks", "Function risks")}</Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t("function", "Function")}</TableCell>
                                    <TableCell>{t("risk", "Risk")}</TableCell>
                                    <TableCell align="right">{t("time", "Time")}</TableCell>
                                    <TableCell align="right">{t("est-calls", "Est. calls")}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.functionRisks.map((f) => (
                                    <TableRow key={f.key}>
                                        <TableCell>{f.name}</TableCell>
                                        <TableCell><Chip size="small" color={riskColor(f.risk)} label={f.risk.toUpperCase()} /></TableCell>
                                        <TableCell align="right">{valueToString(f.totalTime, "duration")}</TableCell>
                                        <TableCell align="right">{valueToString(f.estimatedCalls, "quantity")}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 6 }}>
                    <Paper sx={{ p: 4, height: "100%" }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>{t("impact-map", "Impact map")}</Typography>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t("object", "Object")}</TableCell>
                                    <TableCell>{t("node-types", "Node types")}</TableCell>
                                    <TableCell align="right">{t("occurrences", "Occurrences")}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.hotspots.slice(0, 20).map((o) => (
                                    <TableRow key={`impact-${o.key}`}>
                                        <TableCell>{o.schema ? `${o.schema}.${o.name}` : o.name}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                                {Array.from(o.nodeTypes).slice(0, 4).map((nt) => (
                                                    <Chip key={`${o.key}-${nt}`} size="small" label={nt} />
                                                ))}
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">{o.nodeCount}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};