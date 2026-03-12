import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { IRichStat, IRichContainerDefaults } from "../types";
import { getSeverityColor } from "..";
import RichIcon from "../nodes/RichIcon";

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

    const getColSize = (size?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | "auto") => {
        if (size === "auto" || size === undefined) {
            return "auto";
        }
        return `${(size / 12) * 100}%`;
    };

    const severity = node.severity ?? "default";
    const borderColor = getSeverityColor(severity, theme);
    const isHighlighted = severity !== "default";

    return (
        <Box
            className="RichContainer-stat"
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                padding: defaults?.padding ?? 3,
                width: getColSize(node.size),
                minWidth: 0,
                border: isHighlighted ? `1px solid ${borderColor}` : `1px solid ${theme.palette.divider}`,
                borderLeft: isHighlighted ? `4px solid ${borderColor}` : `4px solid ${theme.palette.divider}`,
                borderRadius: 1,
                backgroundColor: isHighlighted
                    ? theme.palette.mode === "dark"
                        ? `${borderColor}18`
                        : `${borderColor}12`
                    : undefined,
            }}
        >
            {/* Wartość + Ikona + Trend */}
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
                    {node.trend && (
                        <Typography
                            variant="caption"
                            sx={{
                                fontSize: "1.25rem",
                                fontWeight: "bold",
                                color: borderColor,
                            }}
                        >
                            {getTrendIcon(node.trend)}
                        </Typography>
                    )}
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            color: isHighlighted ? borderColor : "inherit",
                        }}
                    >
                        {node.value}
                    </Typography>
                </Box>
                {node.icon && (
                    <RichIcon node={{ type: "icon", icon: node.icon, severity }} />
                )}
            </Box>

            {/* Etykieta */}
            <Typography
                variant="caption"
                sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                }}
            >
                {node.label}
            </Typography>
        </Box>
    );
};

export default RichStat;