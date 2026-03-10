import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { RichBadgeConfig } from "../types";
import { getSeverityColor } from "..";

interface RichBadgeProps {
    badge: RichBadgeConfig;
}

const RichBadge: React.FC<RichBadgeProps> = ({ badge }) => {
    const theme = useTheme();

    const getDisplayValue = () => {
        if (badge.max !== undefined && typeof badge.value === "number" && badge.value > badge.max) {
            return `${badge.max}+`;
        }
        return badge.value;
    };

    return (
        <Box
            sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: (badge.severity ?? "default") === "default" ? theme.palette.primary.main : getSeverityColor(badge.severity, theme),
                padding: "0 6px",
            }}
        >
            <Typography
                variant="caption"
                sx={{
                    color: (badge.severity ?? "default") === "default" ? theme.palette.primary.contrastText : theme.palette.getContrastText(getSeverityColor(badge.severity, theme)),
                    fontWeight: 600,
                    fontSize: "0.75em",
                }}
            >
                {getDisplayValue()}
            </Typography>
        </Box>
    );
};

export default RichBadge;
