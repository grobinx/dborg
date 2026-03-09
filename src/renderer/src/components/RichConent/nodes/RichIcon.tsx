import React from "react";
import { Box, Tooltip, useTheme } from "@mui/material";
import { IRichIcon, RichSeverity } from "../types";
import RichBadge from "./RichBadge";

interface RichIconProps {
    node: IRichIcon;
}

const RichIcon: React.FC<RichIconProps> = ({ node }) => {
    const theme = useTheme();

    const getSeverityColor = (severity?: RichSeverity): string => {
        switch (severity) {
            case "error":
                return theme.palette.error.main;
            case "warning":
                return theme.palette.warning.main;
            case "success":
                return theme.palette.success.main;
            case "info":
                return theme.palette.info.main;
            default:
                return "inherit";
        }
    };

    const getSizeInPixels = (size?: "small" | "medium" | "large") => {
        switch (size) {
            case "small":
                return "20px";
            case "large":
                return "32px";
            default:
                return "24px";
        }
    };

    const iconNode = React.isValidElement(node.icon) ?
        node.icon :
        typeof node.icon === "string" ?
            <Box sx={{ color: getSeverityColor(node.severity) }}>{node.icon}</Box> :
            node.icon;

    const content = (
        <Box
            sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                color: getSeverityColor(node.severity),
            }}
        >
            {iconNode}
            {node.badge && (
                <Box
                    sx={{
                        position: "absolute",
                        top: "-6px",
                        right: "-6px",
                    }}
                >
                    <RichBadge badge={node.badge} />
                </Box>
            )}
        </Box>
    );

    if (node.tooltip) {
        return <Tooltip title={node.tooltip}>{content}</Tooltip>;
    }

    return content;
};

export default RichIcon;
