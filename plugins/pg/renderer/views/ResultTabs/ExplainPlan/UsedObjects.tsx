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

type SortDirection = "asc" | "desc";
type SortState<K extends string> = { key: K; direction: SortDirection };

type UsedObjectsSortKey = "object" | "type" | "nodes" | "time" | "cost" | "rows" | "reads";
type HotspotsSortKey = "object" | "time" | "reads";
type TableCoverageSortKey = "table" | "seq" | "idx" | "idxOnly" | "bitmap" | "coverage";
type FunctionRiskSortKey = "function" | "risk" | "time" | "calls";
type ImpactMapSortKey = "object" | "nodeTypes" | "occurrences";

const defaultOptions: UsedObjectsOptions = {
    functionRiskHighTime: 100,
    functionRiskHighCalls: 10000,
    functionRiskHighReads: 100,
};

const functionRiskRank: Record<FunctionRisk["risk"], number> = { low: 1, medium: 2, high: 3 };

const toggleSort = <K extends string>(
    prev: SortState<K>,
    key: K,
    defaultDirection: SortDirection = "asc"
): SortState<K> =>
    prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: defaultDirection };

const comparePrimitive = (a: string | number, b: string | number): number => {
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b), undefined, { sensitivity: "base", numeric: true });
};

const sortRows = <T, K extends string>(
    rows: T[],
    sort: SortState<K>,
    pickers: Record<K, (row: T) => string | number>
): T[] => {
    const pick = pickers[sort.key];

    return rows
        .map((row, index) => ({ row, index }))
        .sort((a, b) => {
            const cmp = comparePrimitive(pick(a.row), pick(b.row));
            if (cmp !== 0) return sort.direction === "asc" ? cmp : -cmp;
            return a.index - b.index;
        })
        .map((x) => x.row);
};

export const UsedObjects: React.FC<{
    plan: ExplainResultKind | null;
    options?: Partial<UsedObjectsOptions>;
}> = ({ plan, options }) => {
    const { t } = useTranslation();

    const opts = useMemo(
        () => ({ ...defaultOptions, ...options }),
        [options?.functionRiskHighTime, options?.functionRiskHighCalls, options?.functionRiskHighReads]
    );

    const [usedObjectsSort, setUsedObjectsSort] = useState<SortState<UsedObjectsSortKey>>({ key: "time", direction: "desc" });
    const [hotspotsSort, setHotspotsSort] = useState<SortState<HotspotsSortKey>>({ key: "time", direction: "desc" });
    const [tableCoverageSort, setTableCoverageSort] = useState<SortState<TableCoverageSortKey>>({ key: "coverage", direction: "asc" });
    const [functionRiskSort, setFunctionRiskSort] = useState<SortState<FunctionRiskSortKey>>({ key: "risk", direction: "desc" });
    const [impactSort, setImpactSort] = useState<SortState<ImpactMapSortKey>>({ key: "occurrences", direction: "desc" });

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

    const usedObjectsRows = useMemo(() => {
        if (!data) return [];
        return sortRows(data.objects, usedObjectsSort, {
            object: (o) => `${o.schema ? `${o.schema}.` : ""}${o.name}`,
            type: (o) => o.type,
            nodes: (o) => o.nodeCount,
            time: (o) => o.totalTime,
            cost: (o) => o.totalCost,
            rows: (o) => o.totalRows,
            reads: (o) => o.sharedReadBlocks,
        });
    }, [data, usedObjectsSort]);

    const hotspotsRows = useMemo(() => {
        if (!data) return [];
        return sortRows(data.hotspots, hotspotsSort, {
            object: (o) => `${o.schema ? `${o.schema}.` : ""}${o.name}`,
            time: (o) => o.totalTime,
            reads: (o) => o.sharedReadBlocks,
        });
    }, [data, hotspotsSort]);

    const tableCoverageRows = useMemo(() => {
        if (!data) return [];
        return sortRows(data.tableCoverage, tableCoverageSort, {
            table: (o) => `${o.schema ? `${o.schema}.` : ""}${o.name}`,
            seq: (o) => o.seqScans,
            idx: (o) => o.indexScans,
            idxOnly: (o) => o.indexOnlyScans,
            bitmap: (o) => o.bitmapScans,
            coverage: (o) => o.indexCoverage ?? -1,
        });
    }, [data, tableCoverageSort]);

    const functionRiskRows = useMemo(() => {
        if (!data) return [];
        return sortRows(data.functionRisks, functionRiskSort, {
            function: (o) => o.name,
            risk: (o) => functionRiskRank[o.risk],
            time: (o) => o.totalTime,
            calls: (o) => o.estimatedCalls,
        });
    }, [data, functionRiskSort]);

    const impactRows = useMemo(() => {
        if (!data) return [];
        return sortRows(data.hotspots, impactSort, {
            object: (o) => `${o.schema ? `${o.schema}.` : ""}${o.name}`,
            nodeTypes: (o) => Array.from(o.nodeTypes).sort().join(", "),
            occurrences: (o) => o.nodeCount,
        });
    }, [data, impactSort]);

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
                                    <TableCell>
                                        <TableSortLabel
                                            active={usedObjectsSort.key === "object"}
                                            direction={usedObjectsSort.key === "object" ? usedObjectsSort.direction : "asc"}
                                            onClick={() => setUsedObjectsSort((prev) => toggleSort(prev, "object", "asc"))}
                                        >
                                            {t("object", "Object")}
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={usedObjectsSort.key === "type"}
                                            direction={usedObjectsSort.key === "type" ? usedObjectsSort.direction : "asc"}
                                            onClick={() => setUsedObjectsSort((prev) => toggleSort(prev, "type", "asc"))}
                                        >
                                            {t("type", "Type")}
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={usedObjectsSort.key === "nodes"}
                                            direction={usedObjectsSort.key === "nodes" ? usedObjectsSort.direction : "asc"}
                                            onClick={() => setUsedObjectsSort((prev) => toggleSort(prev, "nodes", "desc"))}
                                        >
                                            {t("nodes", "Nodes")}
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={usedObjectsSort.key === "time"}
                                            direction={usedObjectsSort.key === "time" ? usedObjectsSort.direction : "asc"}
                                            onClick={() => setUsedObjectsSort((prev) => toggleSort(prev, "time", "desc"))}
                                        >
                                            {t("time", "Time")}
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={usedObjectsSort.key === "cost"}
                                            direction={usedObjectsSort.key === "cost" ? usedObjectsSort.direction : "asc"}
                                            onClick={() => setUsedObjectsSort((prev) => toggleSort(prev, "cost", "desc"))}
                                        >
                                            {t("cost", "Cost")}
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={usedObjectsSort.key === "rows"}
                                            direction={usedObjectsSort.key === "rows" ? usedObjectsSort.direction : "asc"}
                                            onClick={() => setUsedObjectsSort((prev) => toggleSort(prev, "rows", "desc"))}
                                        >
                                            {t("rows", "Rows")}
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={usedObjectsSort.key === "reads"}
                                            direction={usedObjectsSort.key === "reads" ? usedObjectsSort.direction : "asc"}
                                            onClick={() => setUsedObjectsSort((prev) => toggleSort(prev, "reads", "desc"))}
                                        >
                                            {t("reads", "Reads")}
                                        </TableSortLabel>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {usedObjectsRows.map((o) => (
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
                                    <TableCell>
                                        <TableSortLabel
                                            active={hotspotsSort.key === "object"}
                                            direction={hotspotsSort.key === "object" ? hotspotsSort.direction : "asc"}
                                            onClick={() => setHotspotsSort((prev) => toggleSort(prev, "object", "asc"))}
                                        >
                                            {t("object", "Object")}
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={hotspotsSort.key === "time"}
                                            direction={hotspotsSort.key === "time" ? hotspotsSort.direction : "asc"}
                                            onClick={() => setHotspotsSort((prev) => toggleSort(prev, "time", "desc"))}
                                        >
                                            {t("time", "Time")}
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={hotspotsSort.key === "reads"}
                                            direction={hotspotsSort.key === "reads" ? hotspotsSort.direction : "asc"}
                                            onClick={() => setHotspotsSort((prev) => toggleSort(prev, "reads", "desc"))}
                                        >
                                            {t("reads", "Reads")}
                                        </TableSortLabel>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {hotspotsRows.slice(0, 15).map((o, i) => (
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
                                    <TableCell>
                                        <TableSortLabel
                                            active={tableCoverageSort.key === "table"}
                                            direction={tableCoverageSort.key === "table" ? tableCoverageSort.direction : "asc"}
                                            onClick={() => setTableCoverageSort((prev) => toggleSort(prev, "table", "asc"))}
                                        >
                                            {t("table", "Table")}
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={tableCoverageSort.key === "seq"}
                                            direction={tableCoverageSort.key === "seq" ? tableCoverageSort.direction : "asc"}
                                            onClick={() => setTableCoverageSort((prev) => toggleSort(prev, "seq", "desc"))}
                                        >
                                            Seq
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={tableCoverageSort.key === "idx"}
                                            direction={tableCoverageSort.key === "idx" ? tableCoverageSort.direction : "asc"}
                                            onClick={() => setTableCoverageSort((prev) => toggleSort(prev, "idx", "desc"))}
                                        >
                                            Idx
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={tableCoverageSort.key === "idxOnly"}
                                            direction={tableCoverageSort.key === "idxOnly" ? tableCoverageSort.direction : "asc"}
                                            onClick={() => setTableCoverageSort((prev) => toggleSort(prev, "idxOnly", "desc"))}
                                        >
                                            IdxOnly
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={tableCoverageSort.key === "bitmap"}
                                            direction={tableCoverageSort.key === "bitmap" ? tableCoverageSort.direction : "asc"}
                                            onClick={() => setTableCoverageSort((prev) => toggleSort(prev, "bitmap", "desc"))}
                                        >
                                            Bitmap
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={tableCoverageSort.key === "coverage"}
                                            direction={tableCoverageSort.key === "coverage" ? tableCoverageSort.direction : "asc"}
                                            onClick={() => setTableCoverageSort((prev) => toggleSort(prev, "coverage", "asc"))}
                                        >
                                            {t("coverage", "Coverage")}
                                        </TableSortLabel>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tableCoverageRows.map((tRow) => (
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
                                    <TableCell>
                                        <TableSortLabel
                                            active={functionRiskSort.key === "function"}
                                            direction={functionRiskSort.key === "function" ? functionRiskSort.direction : "asc"}
                                            onClick={() => setFunctionRiskSort((prev) => toggleSort(prev, "function", "asc"))}
                                        >
                                            {t("function", "Function")}
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={functionRiskSort.key === "risk"}
                                            direction={functionRiskSort.key === "risk" ? functionRiskSort.direction : "asc"}
                                            onClick={() => setFunctionRiskSort((prev) => toggleSort(prev, "risk", "desc"))}
                                        >
                                            {t("risk", "Risk")}
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={functionRiskSort.key === "time"}
                                            direction={functionRiskSort.key === "time" ? functionRiskSort.direction : "asc"}
                                            onClick={() => setFunctionRiskSort((prev) => toggleSort(prev, "time", "desc"))}
                                        >
                                            {t("time", "Time")}
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={functionRiskSort.key === "calls"}
                                            direction={functionRiskSort.key === "calls" ? functionRiskSort.direction : "asc"}
                                            onClick={() => setFunctionRiskSort((prev) => toggleSort(prev, "calls", "desc"))}
                                        >
                                            {t("est-calls", "Est. calls")}
                                        </TableSortLabel>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {functionRiskRows.map((f) => (
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
                                    <TableCell>
                                        <TableSortLabel
                                            active={impactSort.key === "object"}
                                            direction={impactSort.key === "object" ? impactSort.direction : "asc"}
                                            onClick={() => setImpactSort((prev) => toggleSort(prev, "object", "asc"))}
                                        >
                                            {t("object", "Object")}
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell>
                                        <TableSortLabel
                                            active={impactSort.key === "nodeTypes"}
                                            direction={impactSort.key === "nodeTypes" ? impactSort.direction : "asc"}
                                            onClick={() => setImpactSort((prev) => toggleSort(prev, "nodeTypes", "asc"))}
                                        >
                                            {t("node-types", "Node types")}
                                        </TableSortLabel>
                                    </TableCell>
                                    <TableCell align="right">
                                        <TableSortLabel
                                            active={impactSort.key === "occurrences"}
                                            direction={impactSort.key === "occurrences" ? impactSort.direction : "asc"}
                                            onClick={() => setImpactSort((prev) => toggleSort(prev, "occurrences", "desc"))}
                                        >
                                            {t("occurrences", "Occurrences")}
                                        </TableSortLabel>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {impactRows.slice(0, 20).map((o) => (
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