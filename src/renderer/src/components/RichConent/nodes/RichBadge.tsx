import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichBadge } from "../types";
import UnboundBadge from "@renderer/components/UnboundBadge";
import { ThemeColor } from "@renderer/types/colors";

interface RichBadgeProps {
    badge: IRichBadge;
    defaults?: IRichContainerDefaults;
}

const getPositionStyle = (
    position: IRichBadge["position"] = "top-right"
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
        <div className="RichNode-badge" style={{ position: "relative" }}>
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
