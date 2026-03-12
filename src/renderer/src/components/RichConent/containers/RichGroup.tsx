import React from "react";
import { Box, Paper, Typography, Collapse, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichGroup } from "../types";
import RichRenderer, { getSeverityColor } from "..";
import { resolveIcon } from "@renderer/themes/icons";
import { ToolButton } from "@renderer/components/buttons/ToolButton";
import { Optional } from "@renderer/types/universal";

interface RichGroupProps {
    node: Optional<IRichGroup, "type" | "items">;
    defaults?: IRichContainerDefaults;
    children?: React.ReactNode;
}

const RichGroup: React.FC<RichGroupProps> = ({ node, defaults, children }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = React.useState(node.defaultExpanded !== false);

    return (
        <Paper
            className="RichContainer-group"
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
                        backgroundColor: getSeverityColor(node.severity, theme),
                        color: getSeverityColor(node.severity, theme, true),
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
                        typeof node.title === "string" ? (
                            <Typography variant="subtitle2" sx={{ flex: 1 }}>
                                {node.title}
                            </Typography>
                        ) : (
                            <RichRenderer node={node.title} defaults={defaults} />
                        ))}
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
                    {node.items?.map((item, index) => (
                        <RichRenderer key={index} node={item} defaults={defaults} />
                    ))}
                    {children}
                </Box>
            </Collapse>
        </Paper>
    );
};

export default RichGroup;
