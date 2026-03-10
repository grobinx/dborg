import React from "react";
import { Box, Paper, Typography, Collapse, useTheme, IconButton } from "@mui/material";
import { IRichGroup } from "../types";
import RichRenderer from "..";
import { resolveIcon } from "@renderer/themes/icons";

interface RichGroupProps {
    node: IRichGroup;
}

const RichGroup: React.FC<RichGroupProps> = ({ node }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = React.useState(node.defaultExpanded !== false);

    const getSeverityColor = (severity?: string) => {
        switch (severity) {
            case "error":
                return theme.palette.error.light;
            case "warning":
                return theme.palette.warning.light;
            case "success":
                return theme.palette.success.light;
            case "info":
                return theme.palette.info.light;
            default:
                return theme.palette.action.hover;
        }
    };

    return (
        <Paper
            sx={{
                border: `1px solid ${theme.palette.divider}`,
                mb: 2,
                overflow: "hidden",
            }}
        >
            {(node.title || node.collapsible) && (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        padding: "12px 16px",
                        backgroundColor: getSeverityColor(node.severity),
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        cursor: node.collapsible ? "pointer" : "default",
                    }}
                    onClick={() => node.collapsible && setExpanded(!expanded)}
                >
                    {node.icon && (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                            {resolveIcon(theme, node.icon)}
                        </Box>
                    )}
                    {node.title && (
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, flex: 1 }}>
                            {node.title}
                        </Typography>
                    )}
                    {node.collapsible && (
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(!expanded);
                            }}
                        >
                            <span>{expanded ? "−" : "+"}</span>
                        </IconButton>
                    )}
                </Box>
            )}
            <Collapse in={!node.collapsible || expanded}>
                <Box sx={{ padding: "16px", display: "flex", flexDirection: "column", gap: node.gap ?? 4 }}>
                    <RichRenderer node={node.items} />
                </Box>
            </Collapse>
        </Paper>
    );
};

export default RichGroup;
