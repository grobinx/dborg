import React from "react";
import { Box, useTheme } from "@mui/material";
import { IRichStat, RichColSize, IRichEnvironment } from "../types";
import RichRenderer, { RichProp, RichRow } from "..";
import RichIcon from "./RichIcon";
import clsx from "@renderer/utils/clsx";
import SurfaceBox from "../utils/SurfaceBox";
import { Optional } from "@renderer/types/universal";
import Tooltip from "@renderer/components/Tooltip";

interface RichStatProps extends RichProp {
    node: Optional<IRichStat, "type">;
    environment?: IRichEnvironment;
}

const RichStat: React.FC<RichStatProps> = ({ node, environment }) => {
    const theme = useTheme();

    const getTrendIcon = (trend?: "up" | "down" | "flat") => {
        switch (trend) {
            case "up":
                return "↑";
            case "down":
                return "↓";
            case "flat":
                return "→";
            default:
                return null;
        }
    };

    const getColSize = (size?: RichColSize) => {
        if (size === "auto" || size === "stretch" || size === undefined) {
            return "auto";
        }
        return `calc(${(size / 12) * 100}% - ${(environment?.theme?.gap ?? 4)}px)`;
    };

    if (node.excluded) {
        return null;
    }

    const severity = node.severity ?? "default";

    const result = (
        <SurfaceBox
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-stat", node.className)}
            style={node.style}
            severity={severity}
            variant={"callout"}
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
            {/* Wartość + Ikona + Trend */}
            <RichRow node={{ justify: "space-between", items: [] }} environment={environment}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: environment?.theme?.gap ?? 4 }}>
                    {node.trend && (
                        <RichIcon node={{ icon: getTrendIcon(node.trend), severity }} environment={environment} />
                    )}
                    <RichRenderer node={node.value} environment={environment} textVariant="title" textSeverity={node.severity ?? "info"} />
                </Box>
                {node.icon && (
                    <RichIcon node={{ icon: node.icon, severity, size: "large" }} environment={environment} />
                )}
            </RichRow>

            {/* Etykieta */}
            <RichRenderer node={node.label} environment={environment} textVariant="label" />
        </SurfaceBox>
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

export default RichStat;