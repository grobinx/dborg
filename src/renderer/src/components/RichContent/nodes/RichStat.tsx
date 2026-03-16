import React from "react";
import { Box, useTheme } from "@mui/material";
import { IRichStat, IRichContainerDefaults, RichColSize } from "../types";
import RichRenderer, { getSeverityColor, RichRow } from "..";
import RichIcon from "./RichIcon";
import clsx from "@renderer/utils/clsx";
import CalloutBox from "../utils/CalloutBox";
import { Optional } from "@renderer/types/universal";
import Tooltip from "@renderer/components/Tooltip";

interface RichStatProps {
    node: Optional<IRichStat, "type">;
    defaults?: IRichContainerDefaults;
}

const RichStat: React.FC<RichStatProps> = ({ node, defaults }) => {
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
        return `calc(${(size / 12) * 100}% - ${(defaults?.gap ?? 4)}px)`;
    };

    if (node.excluded) {
        return null;
    }

    const severity = node.severity ?? "default";

    const result = (
        <CalloutBox
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-stat", node.className)}
            style={node.style}
            severity={severity}
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: defaults?.gap ?? 4,
                padding: defaults?.padding ?? 4,
                width: node.size === "stretch" ? "100%" : getColSize(node.size),
                flexGrow: node.size === "stretch" ? 1 : undefined,
                minWidth: 0,
            }}
        >
            {/* Wartość + Ikona + Trend */}
            <RichRow node={{ justify: "space-between", items: [] }} defaults={defaults}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: defaults?.gap ?? 4 }}>
                    {node.trend && (
                        <RichIcon node={{ icon: getTrendIcon(node.trend), severity }} defaults={defaults} />
                    )}
                    <RichRenderer node={node.value} defaults={defaults} textVariant="title" textSeverity={node.severity ?? "info"} />
                </Box>
                {node.icon && (
                    <RichIcon node={{ icon: node.icon, severity, size: "large" }} defaults={defaults} />
                )}
            </RichRow>

            {/* Etykieta */}
            <RichRenderer node={node.label} defaults={defaults} textVariant="label" />
        </CalloutBox>
    );

    if (node.tooltip) {
        return (
            <Tooltip title={<RichRenderer node={node.tooltip} defaults={defaults} />}>
                {result}
            </Tooltip>
        );
    }

    return result;
};

export default RichStat;