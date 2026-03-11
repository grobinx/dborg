import React from "react";
import { Box, Paper, Typography, Collapse, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichGroup } from "../types";
import RichRenderer from "..";
import { resolveIcon } from "@renderer/themes/icons";
import { ToolButton } from "@renderer/components/buttons/ToolButton";

interface RichGroupProps {
    node: IRichGroup;
    defaults?: IRichContainerDefaults;
}

const RichGroup: React.FC<RichGroupProps> = ({ node, defaults }) => {
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
                overflow: "hidden",
            }}
        >
            {(node.title || node.collapsible) && (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: defaults?.gap ?? 8,
                        padding: defaults?.padding ?? 8,
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
                        <Typography variant="subtitle2" sx={{ flex: 1 }}>
                            {node.title}
                        </Typography>
                    )}
                    {node.collapsible && (
                        <ToolButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(!expanded);
                            }}
                        >
                            {expanded ? <theme.icons.ExpandLess /> : <theme.icons.ExpandMore />}
                        </ToolButton>
                    )}
                </Box>
            )}
            <Collapse in={!node.collapsible || expanded}>
                <Box sx={{ padding: defaults?.padding ?? 8, display: "flex", flexDirection: "column", gap: node.gap ?? defaults?.gap ?? 8 }}>
                    {node.items.map((item, index) => (
                        <RichRenderer key={index} node={item} defaults={defaults} />
                    ))}
                </Box>
            </Collapse>
        </Paper>
    );
};

export default RichGroup;
