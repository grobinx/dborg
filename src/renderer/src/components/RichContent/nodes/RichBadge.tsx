import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichBadge } from "../types";
import UnboundBadge from "@renderer/components/UnboundBadge";
import { ThemeColor } from "@renderer/types/colors";
import clsx from "@renderer/utils/clsx";
import Tooltip from "@renderer/components/Tooltip";
import RichRenderer from "..";

interface RichBadgeProps {
    node: IRichBadge;
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

const RichBadge: React.FC<RichBadgeProps> = ({ node: node, defaults }) => {
    const theme = useTheme();

    const getDisplayValue = () => {
        if (node.max !== undefined && typeof node.value === "number" && node.value > node.max) {
            return `${node.max}+`;
        }
        return node.value;
    };

    if (node.excluded) {
        return null;
    }

    const result = (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-badge", node.className)}
            style={node.style}
            sx={{ position: "relative" }}
        >
            <UnboundBadge
                content={getDisplayValue()}
                sx={{
                    position: "absolute",
                    ...getPositionStyle(node.position),
                }}
                color={node.severity as ThemeColor}
            />
        </Box>
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

export default RichBadge;
