import React from "react";
import { Box, Skeleton, useTheme } from "@mui/material";
import { IRichEnvironment, IRichMetric, RichColSize } from "../types";
import RichRenderer, { getSeverityColor, resolveRichValue, resolveRichValueFromFunction, RichRow, RichSparkline } from "..";
import RichIcon from "./RichIcon";
import clsx from "@renderer/utils/clsx";
import { Optional } from "@renderer/types/universal";
import CalloutBox from "../utils/CalloutBox";
import Tooltip from "@renderer/components/Tooltip";

interface RichMetricProps {
    node: Optional<IRichMetric, "type">;
    environment?: IRichEnvironment;
}

const CHART_W = 120;
const CHART_H = 28;
const CHART_PAD = 2;

const RichMetric: React.FC<RichMetricProps> = ({ node, environment }) => {
    const theme = useTheme();
    const [sparkline, setSparkline] = React.useState<number[] | null>(resolveRichValue(node.sparkline));

    React.useEffect(() => {
        resolveRichValueFromFunction(node.sparkline, setSparkline);
    }, [node.sparkline]);

    const getColSize = (size?: RichColSize) => {
        if (size === "auto" || size === "stretch" || size === undefined) {
            return "auto";
        }
        return `calc(${(size / 12) * 100}% - ${(environment?.theme?.gap ?? 4)}px)`;
    };

    const severity = node.severity ?? "default";
    const severityColor = getSeverityColor(severity, theme);

    const values = (sparkline ?? []).filter((v) => Number.isFinite(v));
    const hasSparkline = values.length >= 2;
    const latestValue = values.length > 0 ? values[values.length - 1] : null;

    const points = React.useMemo(() => {
        if (!hasSparkline) {
            return "";
        }

        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        const innerW = CHART_W - CHART_PAD * 2;
        const innerH = CHART_H - CHART_PAD * 2;

        return values
            .map((v, i) => {
                const x = CHART_PAD + (i / (values.length - 1)) * innerW;
                const y = CHART_H - CHART_PAD - ((v - min) / range) * innerH;
                return `${x},${y}`;
            })
            .join(" ");
    }, [hasSparkline, values]);

    if (node.excluded) {
        return null;
    }

    const result = (
        <CalloutBox
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-metric", node.className)}
            style={node.style}
            severity={severity}
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: environment?.theme?.gap ?? 4,
                padding: environment?.theme?.padding ?? 4,
                width: node.size === "stretch" ? "100%" : getColSize(node.size),
                flexGrow: node.size === "stretch" ? 1 : undefined,
                minWidth: 0,
            }}
        >
            <RichRow node={{ items: [], align: "center" }} environment={environment}>
                <Box sx={{ flexShrink: 0, minWidth: 0 }}>
                    <RichRow node={{ justify: "space-between", items: [] }} environment={environment}>
                        {latestValue !== null && (
                            <RichRenderer
                                node={`${latestValue}${node.unit ?? ""}`}
                                environment={environment}
                                textVariant="title"
                                textSeverity={severity}
                            />
                        )}
                        {node.icon && (
                            <RichIcon node={{ icon: node.icon, severity, size: "large" }} environment={environment} />
                        )}
                    </RichRow>
                </Box>

                {sparkline === null ? (
                    <Box sx={{ flex: 1, minWidth: 0, height: CHART_H, display: "flex", alignItems: "center" }}>
                        <Skeleton
                            variant="rounded"
                            width="100%"
                            height={CHART_H}
                        />
                    </Box>
                ) : hasSparkline && (
                    <RichSparkline node={{ values, severity, height: CHART_H }} environment={environment} />
                )}
            </RichRow>

            <RichRenderer node={node.label} environment={environment} textVariant="label" />
        </CalloutBox>
    );

    if (node.tooltip) {
        return (
            <Tooltip title={<RichRenderer node={node.tooltip} environment={environment} />}>
                {result}
            </Tooltip>
        );
    }

    return result;
};

export default RichMetric;