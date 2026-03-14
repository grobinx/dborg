import React from "react";
import { Box, Paper, Collapse, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichGroup } from "../types";
import RichRenderer, { getSeverityColor, RichIcon, RichSpacer } from "..";
import { ToolButton } from "@renderer/components/buttons/ToolButton";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";

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
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichContainer-group", node.className)}
            style={node.style}
            sx={{
                overflow: "hidden",
            }}
        >
            {(node.title || node.collapsible) && (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: defaults?.gap ?? 4,
                        padding: defaults?.padding ?? 8,
                        backgroundColor: getSeverityColor(node.severity, theme),
                        color: getSeverityColor(node.severity, theme, true),
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        cursor: node.collapsible ? "pointer" : "default",
                    }}
                    onClick={() => node.collapsible && setExpanded(!expanded)}
                >
                    {node.icon && (
                        <RichIcon node={{ icon: node.icon, size: "large" }} defaults={defaults} />
                    )}
                    {node.title && <RichRenderer node={node.title} defaults={defaults} textVariant="title" />}
                    <RichSpacer node={{}} defaults={defaults} />
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
                <Box sx={{
                    padding: defaults?.padding ?? 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: node.gap ?? defaults?.gap ?? 4
                }}
                >
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
