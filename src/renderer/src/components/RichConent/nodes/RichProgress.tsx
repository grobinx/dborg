import React from "react";
import { LinearProgress, Box, Typography, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichProgress, RichSeverity } from "../types";
import { defaults } from "pg";
import RichText from "./RichText";

interface RichProgressProps {
    node: IRichProgress;
    defaults?: IRichContainerDefaults;
}

const RichProgress: React.FC<RichProgressProps> = ({ node, defaults }) => {
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
        <Box className="RichNode-progress">
            {(node.label || node.showPercent) && (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {node.label && <RichText node={{ text: node.label, variant: "caption" }} defaults={defaults} />}
                    {node.showPercent && (
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {Math.round(node.value)}%
                        </Typography>
                    )}
                </Box>
            )}
            <LinearProgress
                variant={node.bufferValue !== undefined ? "buffer" : "determinate"}
                value={node.value}
                valueBuffer={node.bufferValue}
                color={getColorFromSeverity(node.severity)}
                sx={{ height: "6px", borderRadius: defaults?.radius ?? 4 }}
            />
        </Box>
    );
};

export default RichProgress;
