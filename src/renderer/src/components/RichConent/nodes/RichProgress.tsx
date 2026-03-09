import React from "react";
import { LinearProgress, Box, Typography, useTheme } from "@mui/material";
import { IRichProgress, RichSeverity } from "../types";

interface RichProgressProps {
    node: IRichProgress;
}

const RichProgress: React.FC<RichProgressProps> = ({ node }) => {
    const theme = useTheme();

    const getColorFromSeverity = (severity?: RichSeverity) => {
        switch (severity) {
            case "error":
                return "error";
            case "warning":
                return "warning";
            case "success":
                return "success";
            case "info":
                return "info";
            default:
                return "primary";
        }
    };

    return (
        <Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                {node.label && <Typography variant="caption">{node.label}</Typography>}
                {node.showPercent && (
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        {Math.round(node.value)}%
                    </Typography>
                )}
            </Box>
            <LinearProgress
                variant={node.bufferValue !== undefined ? "buffer" : "determinate"}
                value={node.value}
                valueBuffer={node.bufferValue}
                color={getColorFromSeverity(node.severity)}
                sx={{ height: "6px", borderRadius: "3px" }}
            />
        </Box>
    );
};

export default RichProgress;
