import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { IRichContainerDefaults, RichBadgeConfig } from "../types";
import { getSeverityColor } from "..";
import UnboundBadge from "@renderer/components/UnboundBadge";
import { ThemeColor } from "@renderer/types/colors";

interface RichBadgeProps {
    badge: RichBadgeConfig;
    defaults?: IRichContainerDefaults;
}

const getPositionStyle = (
    position: RichBadgeConfig["position"] = "top-right"
): React.CSSProperties => {
    switch (position) {
        case "top-left":
            return {
                top: 0,
                left: 0,
                transform: "translate(-50%, -50%)",
            };
        case "bottom-right":
            return {
                bottom: 0,
                right: 0,
                transform: "translate(50%, 50%)",
            };
        case "bottom-left":
            return {
                bottom: 0,
                left: 0,
                transform: "translate(-50%, 50%)",
            };
        case "top-right":
        default:
            return {
                top: 0,
                right: 0,
                transform: "translate(50%, -50%)",
            };
    }
};

const RichBadge: React.FC<RichBadgeProps> = ({ badge }) => {
    const theme = useTheme();

    const getDisplayValue = () => {
        if (badge.max !== undefined && typeof badge.value === "number" && badge.value > badge.max) {
            return `${badge.max}+`;
        }
        return badge.value;
    };

    return (
        <div style={{ position: "relative" }}>
            <UnboundBadge
                content={getDisplayValue()}
                sx={{
                    position: "absolute",
                    ...getPositionStyle(badge.position),
                }}
                color={badge.severity as ThemeColor}
            />
        </div>
    );
};

export default RichBadge;
