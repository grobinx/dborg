import React from "react";
import { Box, Paper, Collapse, useTheme } from "@mui/material";
import { IRichEnvironment, IRichSection, RichNode } from "../types";
import RichRenderer, { getSeverityColor, resolveRichValue, resolveRichValueFromFunction, RichIcon, RichSpacer } from "..";
import { ToolButton } from "@renderer/components/buttons/ToolButton";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import Tooltip from "@renderer/components/Tooltip";

interface RichSectionProps {
    node: Optional<IRichSection, "type">;
    environment?: IRichEnvironment;
    children?: React.ReactNode;
}

const RichSection: React.FC<RichSectionProps> = ({ node, environment, children }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = React.useState(node.expanded !== false);
    const [items, setItems] = React.useState<RichNode[] | null>(resolveRichValue(node.items));

    React.useEffect(() => {
        resolveRichValueFromFunction(node.items, setItems);
    }, [node.items]);

    if (node.excluded) {
        return null;
    }

    const result = (
        <Paper
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichContainer-section", node.className)}
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
                        gap: environment?.theme?.gap ?? 4,
                        padding: environment?.theme?.padding ?? 8,
                        backgroundColor: getSeverityColor(node.severity, theme),
                        color: getSeverityColor(node.severity, theme, true),
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        cursor: node.collapsible ? "pointer" : "default",
                    }}
                    onClick={() => node.collapsible && setExpanded(!expanded)}
                >
                    {node.icon && (
                        <RichIcon node={{ icon: node.icon, size: "large" }} environment={environment} />
                    )}
                    {node.title && <RichRenderer node={node.title} environment={environment} textVariant="title" />}
                    <RichSpacer node={{}} environment={environment} />
                    {node.collapsible && (
                        <RichIcon
                            node={{
                                icon: "ExpandMore",
                                style: {
                                    display: "flex",
                                    alignItems: "center",
                                    transition: "transform 0.2s",
                                    transform: !expanded ? "rotate(0deg)" : "rotate(-180deg)",
                                },
                            }}
                            environment={environment}
                        />
                    )}
                </Box>
            )}
            <Collapse in={!node.collapsible || expanded}>
                <Box sx={{
                    padding: environment?.theme?.padding ?? 8,
                    display: "flex",
                    flexDirection: node.direction === "horizontal" ? "row" : "column",
                    gap: node.gap ?? environment?.theme?.gap ?? 4
                }}
                >
                    {items === null ?
                        <RichIcon node={{ icon: "Loading" }} environment={environment} />
                        : items.map((item, index) => (
                            <RichRenderer key={index} node={item} environment={environment} />
                        ))
                    }
                    {children}
                </Box>
            </Collapse>
        </Paper>
    );

    if (node.tooltip) {
        return (
            <Tooltip title={<RichRenderer node={node.tooltip} environment={environment} />}>
                {result}
            </Tooltip>
        );
    }

    return result;
};

export default RichSection;
