import React from "react";
import { Chip, Box, useTheme } from "@mui/material";
import { IRichChip, RichSeverity } from "../types";
import RichBadge from "./RichBadge";

interface RichChipProps {
    node: IRichChip;
}

const RichChip: React.FC<RichChipProps> = ({ node }) => {
    const theme = useTheme();

    const getColorAndVariant = (severity?: RichSeverity) => {
        switch (severity) {
            case "error":
                return { backgroundColor: theme.palette.error.light, color: theme.palette.error.contrastText };
            case "warning":
                return { backgroundColor: theme.palette.warning.light, color: theme.palette.warning.contrastText };
            case "success":
                return { backgroundColor: theme.palette.success.light, color: theme.palette.success.contrastText };
            case "info":
                return { backgroundColor: theme.palette.info.light, color: theme.palette.info.contrastText };
            default:
                return { backgroundColor: theme.palette.action.hover, color: "inherit" };
        }
    };

    const colors = getColorAndVariant(node.severity);

    return (
        <Box sx={{ display: "inline-block", position: "relative" }}>
            <Chip
                label={node.text}
                size="small"
                sx={{
                    ...colors,
                    paddingRight: node.badge ? "8px" : undefined,
                }}
            />
            {node.badge && (
                <Box
                    sx={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                    }}
                >
                    <RichBadge badge={node.badge} />
                </Box>
            )}
        </Box>
    );
};

export default RichChip;
