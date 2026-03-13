import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { IRichStat, IRichContainerDefaults, RichColSize } from "../types";
import { getSeverityColor, RichRow, RichText } from "..";
import RichIcon from "./RichIcon";
import clsx from "@renderer/utils/clsx";

interface RichStatProps {
    node: IRichStat;
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
        if (size === "auto" || size === undefined) {
            return "auto";
        }
        return `calc(${(size / 12) * 100}% - ${(defaults?.gap ?? 4)}px)`;
    };

    const severity = node.severity ?? "default";
    const severityColor = getSeverityColor(severity, theme);
    const isHighlighted = severity !== "default";

    return (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-stat", node.className)}
            style={node.style}
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                padding: defaults?.padding ?? 3,
                width: getColSize(node.size),
                minWidth: 0,
                border: isHighlighted ? `1px solid ${severityColor}` : `1px solid ${theme.palette.divider}`,
                borderLeft: isHighlighted ? `4px solid ${severityColor}` : `4px solid ${theme.palette.divider}`,
                borderRadius: 1,
                backgroundColor: isHighlighted
                    ? theme.palette.mode === "dark"
                        ? `${severityColor}18`
                        : `${severityColor}12`
                    : undefined,
            }}
        >
            {/* Wartość + Ikona + Trend */}
            <RichRow node={{ justify: "space-between" }} defaults={defaults}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    {node.trend && (
                        <RichIcon node={{ icon: getTrendIcon(node.trend), severity }} defaults={defaults} />
                    )}
                    <RichText node={{ variant: "title", text: node.value, severity }} defaults={defaults} />
                </Box>
                {node.icon && (
                    <RichIcon node={{ icon: node.icon, severity }} defaults={defaults} />
                )}
            </RichRow>

            {/* Etykieta */}
            <RichText node={{ variant: "caption", text: node.label }} defaults={defaults} />
        </Box>
    );
};

export default RichStat;