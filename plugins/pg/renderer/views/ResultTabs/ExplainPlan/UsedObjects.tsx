import React, { useMemo, useState } from "react";
import {
    Box,
    Chip,
    Grid2 as Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableSortLabel,
    Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import LoadingOverlay from "@renderer/components/useful/LoadingOverlay";
import { ExplainPlanError } from "./ExplainPlanError";
import { ExplainResult, ExplainResultKind, isErrorResult, isLoadingResult, PlanNode } from "./ExplainTypes";
import { valueToString } from "../../../../../../src/api/db";
import DataPresentationGrid, { DataPresentationGridColumn } from "@renderer/components/DataGrid/DataPresentationGrid";

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

interface UsedObjectsOptions {
    functionRiskHighTime: number;
    functionRiskHighCalls: number;
    functionRiskHighReads: number;
}

const defaultOptions: UsedObjectsOptions = {
    functionRiskHighTime: 100,
    functionRiskHighCalls: 10000,
    functionRiskHighReads: 100,
};

const functionRiskRank: Record<FunctionRisk["risk"], number> = { low: 1, medium: 2, high: 3 };

interface UsedObjectRow {
    key: string;
    object: string;
    type: ObjectType;
    nodes: number;
    time: number;
    cost: number;
    rows: number;
    reads: number;
}

interface HotspotRow {
    key: string;
    rank: number;
    object: string;
    time: number;
    reads: number;
}

interface TableCoverageRowView {
    key: string;
    table: string;
    seq: number;
    idx: number;
    idxOnly: number;
    bitmap: number;
    coverage: number | null;
}

interface FunctionRiskRowView {
    key: string;
    functionName: string;
    risk: FunctionRisk["risk"];
    riskRank: number;
    time: number;
    calls: number;
}

interface ImpactRowView {
    key: string;
    object: string;
    nodeTypes: string;
    nodeTypesList: string[];
    occurrences: number;
}

export const UsedObjects: React.FC<{
    plan: ExplainResultKind | null;
    options?: Partial<UsedObjectsOptions>;
}> = ({ plan, options }) => {
    const { t } = useTranslation();

    const opts = useMemo(
        () => ({ ...defaultOptions, ...options }),
        [options?.functionRiskHighTime, options?.functionRiskHighCalls, options?.functionRiskHighReads]
    );

    const data = useMemo(() => {
        if (!plan || isErrorResult(plan) || isLoadingResult(plan)) return null;

        const collectWithOptions = (planData: ExplainResult) => {
            const result = collect(planData);

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
                .sort((a, b) => functionRiskRank[b.risk] - functionRiskRank[a.risk] || b.totalTime - a.totalTime);

            return result;
        };

        return collectWithOptions(plan);
    }, [plan, opts]);

    const usedObjectsRows = useMemo<UsedObjectRow[]>(
        () =>
            data
                ? data.objects.map((o) => ({
                    key: o.key,
                    object: o.schema ? `${o.schema}.${o.name}` : o.name,
                    type: o.type,
                    nodes: o.nodeCount,
                    time: o.totalTime,
                    cost: o.totalCost,
                    rows: o.totalRows,
                    reads: o.sharedReadBlocks,
                }))
                : [],
        [data]
    );

    const hotspotsRows = useMemo<HotspotRow[]>(
        () =>
            data
                ? data.hotspots.map((o, i) => ({
                    key: o.key,
                    rank: i + 1,
                    object: o.schema ? `${o.schema}.${o.name}` : o.name,
                    time: o.totalTime,
                    reads: o.sharedReadBlocks,
                }))
                : [],
        [data]
    );

    const tableCoverageRows = useMemo<TableCoverageRowView[]>(
        () =>
            data
                ? data.tableCoverage.map((o) => ({
                    key: o.key,
                    table: o.schema ? `${o.schema}.${o.name}` : o.name,
                    seq: o.seqScans,
                    idx: o.indexScans,
                    idxOnly: o.indexOnlyScans,
                    bitmap: o.bitmapScans,
                    coverage: o.indexCoverage,
                }))
                : [],
        [data]
    );

    const functionRiskRows = useMemo<FunctionRiskRowView[]>(
        () =>
            data
                ? data.functionRisks.map((o) => ({
                    key: o.key,
                    functionName: o.name,
                    risk: o.risk,
                    riskRank: functionRiskRank[o.risk],
                    time: o.totalTime,
                    calls: o.estimatedCalls,
                }))
                : [],
        [data]
    );

    const impactRows = useMemo<ImpactRowView[]>(
        () =>
            data
                ? data.hotspots.map((o) => {
                    const nodeTypesList = Array.from(o.nodeTypes).sort();
                    return {
                        key: o.key,
                        object: o.schema ? `${o.schema}.${o.name}` : o.name,
                        nodeTypes: nodeTypesList.join(", "),
                        nodeTypesList,
                        occurrences: o.nodeCount,
                    };
                })
                : [],
        [data]
    );

    const usedObjectsColumns = useMemo<DataPresentationGridColumn<UsedObjectRow>[]>(() => [
        { key: "object", label: t("object", "Object") },
        { key: "type", label: t("type", "Type") },
        { key: "nodes", label: t("nodes", "Nodes"), align: "right", dataType: "quantity" },
        { key: "time", label: t("time", "Time"), align: "right", dataType: "duration" },
        { key: "cost", label: t("cost", "Cost"), align: "right", dataType: "decimal" },
        { key: "rows", label: t("rows", "Rows"), align: "right", dataType: "quantity" },
        { key: "reads", label: t("reads", "Reads"), align: "right", dataType: "quantity" },
    ], [t]);

    const hotspotsColumns = useMemo<DataPresentationGridColumn<HotspotRow>[]>(() => [
        { key: "rank", label: "#", align: "right", sortable: false, dataType: "quantity" },
        { key: "object", label: t("object", "Object") },
        { key: "time", label: t("time", "Time"), align: "right", dataType: "duration" },
        { key: "reads", label: t("reads", "Reads"), align: "right", dataType: "quantity" },
    ], [t]);

    const tableCoverageColumns = useMemo<DataPresentationGridColumn<TableCoverageRowView>[]>(() => [
        { key: "table", label: t("table", "Table") },
        { key: "seq", label: "Seq", align: "right", dataType: "quantity" },
        { key: "idx", label: "Idx", align: "right", dataType: "quantity" },
        { key: "idxOnly", label: "IdxOnly", align: "right", dataType: "quantity" },
        { key: "bitmap", label: "Bitmap", align: "right", dataType: "quantity" },
        {
            key: "coverage",
            label: t("coverage", "Coverage"),
            align: "right",
            formatter: (v) => (v === null ? "N/A" : valueToString(v, "percentage")),
        },
    ], [t]);

    const functionRiskColumns = useMemo<DataPresentationGridColumn<FunctionRiskRowView>[]>(() => [
        { key: "functionName", label: t("function", "Function"), formatter: (v) => String(v ?? "") },
        {
            key: "riskRank",
            label: t("risk", "Risk"),
            formatter: (_v, row) => <Chip size="small" color={riskColor(row.risk)} label={row.risk.toUpperCase()} />,
        },
        { key: "time", label: t("time", "Time"), align: "right", dataType: "duration" },
        { key: "calls", label: t("est-calls", "Est. calls"), align: "right", dataType: "quantity" },
    ], [t]);

    const impactColumns = useMemo<DataPresentationGridColumn<ImpactRowView>[]>(() => [
        { key: "object", label: t("object", "Object"), formatter: (v) => String(v ?? "") },
        {
            key: "nodeTypes",
            label: t("node-types", "Node types"),
            formatter: (_v, row) => (
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {row.nodeTypesList.slice(0, 4).map((nt) => (
                        <Chip key={`${row.key}-${nt}`} size="small" label={nt} />
                    ))}
                </Box>
            ),
        },
        { key: "occurrences", label: t("occurrences", "Occurrences"), align: "right", dataType: "quantity" },
    ], [t]);

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
                        <DataPresentationGrid
                            data={usedObjectsRows}
                            columns={usedObjectsColumns}
                            initialSort={{ key: "time", direction: "desc" }}
                            slotProps={{ container: { sx: { maxHeight: 400 } } }}
                        />
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 6 }}>
                    <Paper sx={{ p: 4, height: "100%" }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>{t("hotspot-ranking", "Hotspot ranking per object")}</Typography>
                        <DataPresentationGrid
                            data={hotspotsRows}
                            columns={hotspotsColumns}
                            initialSort={{ key: "time", direction: "desc" }}
                            limit={15}
                            slotProps={{ container: { sx: { maxHeight: 400 } } }}
                        />
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 6 }}>
                    <Paper sx={{ p: 4, height: "100%" }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>{t("index-coverage", "Index coverage on tables")}</Typography>
                        <DataPresentationGrid
                            data={tableCoverageRows}
                            columns={tableCoverageColumns}
                            initialSort={{ key: "coverage", direction: "asc" }}
                            slotProps={{ container: { sx: { maxHeight: 400 } } }}
                        />
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 6 }}>
                    <Paper sx={{ p: 4, height: "100%" }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>{t("function-risks", "Function risks")}</Typography>
                        <DataPresentationGrid
                            data={functionRiskRows}
                            columns={functionRiskColumns}
                            initialSort={{ key: "riskRank", direction: "desc" }}
                            slotProps={{ container: { sx: { maxHeight: 400 } } }}
                        />
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, lg: 6 }}>
                    <Paper sx={{ p: 4, height: "100%" }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>{t("impact-map", "Impact map")}</Typography>
                        <DataPresentationGrid
                            data={impactRows}
                            columns={impactColumns}
                            initialSort={{ key: "occurrences", direction: "desc" }}
                            limit={20}
                            slotProps={{ container: { sx: { maxHeight: 400 } } }}
                        />
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};