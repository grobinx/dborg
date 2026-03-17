import React from "react";
import { Box, Collapse, useTheme } from "@mui/material";
import { IRichTree, IRichTreeItem, IRichEnvironment, RichNode } from "../types";
import RichRenderer, { resolveRichValue, resolveRichValueFromFunction, RichColumn, RichRow } from "..";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import Tooltip from "@renderer/components/Tooltip";
import RichIcon from "../nodes/RichIcon";
import CalloutBox from "../utils/CalloutBox";

interface RichTreeItemProps {
    node: IRichTreeItem;
    level: number;
    environment?: IRichEnvironment;
}

const TREE_INDENT = 24;
const CONNECTOR_X = 8;
const CONNECTOR_Y = 16;

const RichTreeItemComponent: React.FC<RichTreeItemProps> = ({ node, level, environment }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = React.useState(node.expanded ?? true);
    const isCollapsible = node.collapsible !== false;
    const [items, setItems] = React.useState<IRichTreeItem[] | null | undefined>(
        resolveRichValue(node.items)
    );
    const hasChildren = items && items?.length > 0;
    const [content, setContent] = React.useState<RichNode | null>(resolveRichValue(node.content));

    React.useEffect(() => {
        resolveRichValueFromFunction<RichNode>(node.content, setContent);
    }, [node.content]);

    React.useEffect(() => {
        resolveRichValueFromFunction<IRichTreeItem[] | null | undefined>(node.items, setItems);
    }, [node.items]);

    const handleToggle = () => {
        if (hasChildren && isCollapsible) {
            setExpanded(!expanded);
        }
    };

    if (node.excluded) {
        return null;
    }

    const itemContent = (
        <CalloutBox
            component={"li"}
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx(
                "RichNode-tree-item",
                node.className,
                (node.indicator && (node.severity ?? "default") !== "default") && "indicator",
            )}
            style={node.style}
            severity={node.indicator ? (node.severity ?? "default") : undefined}
            sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: environment?.theme?.gap ?? 4,
                padding: node.padding ?? 4,
                cursor: hasChildren && isCollapsible ? "pointer" : "default",
                userSelect: "none",
                "&:hover": {
                    backgroundColor: hasChildren && isCollapsible ? theme.palette.action.hover : "transparent",
                },
            }}
            onClick={handleToggle}
        >
            {hasChildren && (
                <RichColumn node={{ items: [], style: { paddingLeft: 0, paddingRight: 0 } }} environment={environment}>
                    <RichIcon
                        node={{
                            icon: "ExpandMore",
                            style: {
                                display: "flex",
                                alignItems: "center",
                                transition: "transform 0.2s",
                                transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
                            },
                        }}
                        environment={environment}
                    />
                </RichColumn>
            )}

            {content === null ?
                <RichIcon node={{ icon: "Loading" }} environment={environment} />
                : <RichRenderer node={content} environment={environment} />
            }
        </CalloutBox>
    );

    const itemWithTooltip = node.tooltip ? (
        <Tooltip title={<RichRenderer node={node.tooltip} environment={environment} />}>
            {itemContent}
        </Tooltip>
    ) : (
        itemContent
    );

    return (
        <Box
            key={node.key ?? node.id}
            sx={{
                position: "relative",
                mb: 0,
                pl: level > 0 ? `${TREE_INDENT}px` : 0,
                "&::before":
                    level > 0
                        ? {
                            content: '""',
                            position: "absolute",
                            left: `${CONNECTOR_X}px`,
                            top: 0,
                            bottom: 0,
                            width: "1px",
                            bgcolor: "divider",
                        }
                        : undefined,
                "&::after":
                    level > 0
                        ? {
                            content: '""',
                            position: "absolute",
                            left: `${CONNECTOR_X}px`,
                            top: `${CONNECTOR_Y}px`,
                            width: `${TREE_INDENT - CONNECTOR_X - 4}px`,
                            height: "1px",
                            bgcolor: "divider",
                        }
                        : undefined,
                margin: 0,
                "& li.indicator": {
                    marginBottom: environment?.theme?.gap ?? 4,
                },
            }}
        >
            {itemWithTooltip}

            {items !== undefined && (
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    {items === null ? (
                        <RichIcon node={{ icon: "Loading" }} environment={environment} />
                    ) : (
                        items.map((child, idx) => (
                            <RichTreeItemComponent
                                key={child.key ?? child.id ?? idx}
                                node={child}
                                level={level + 1}
                                environment={environment}
                            />
                        ))
                    )}
                </Collapse>
            )}
        </Box>
    );
};

interface RichTreeProps {
    node: Optional<IRichTree, "type">;
    environment?: IRichEnvironment;
}

const RichTree: React.FC<RichTreeProps> = ({ node, environment }) => {
    const [items, setItems] = React.useState<IRichTreeItem[] | null>(
        resolveRichValue(node.items)
    );

    React.useEffect(() => {
        resolveRichValueFromFunction<IRichTreeItem[]>(node.items, setItems);
    }, [node.items]);

    if (node.excluded) {
        return null;
    }

    const result = (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-tree", node.className)}
            style={node.style}
            sx={{
                fontFamily: environment?.theme?.fontFamily ?? "inherit",
                fontSize: environment?.theme?.fontSize ?? "inherit",
            }}
        >
            {items === null ?
                <RichIcon node={{ icon: "Loading" }} environment={environment} />
                : items.map((item, idx) => (
                    <RichTreeItemComponent
                        key={item.key ?? item.id ?? idx}
                        node={item}
                        level={0}
                        environment={environment}
                    />
                ))
            }
        </Box>
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

export default RichTree;