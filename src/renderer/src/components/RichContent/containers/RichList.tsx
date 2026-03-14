import React from "react";
import { List, ListItem, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichList, IRichListItem } from "../types";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import RichRenderer, { getSeverityColor } from "..";

interface RichListItemProps {
    node: IRichListItem;
    defaults?: IRichContainerDefaults;
    children?: React.ReactNode;
}

const RichListItem: React.FC<RichListItemProps> = ({ node, defaults, children }) => {
    const theme = useTheme();

    return (
        <ListItem
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx(
                "RichContainer-listItem",
                (node.indicator && (node.severity ?? "default") !== "default") && "indicator",
                node.className
            )}
            style={node.style}
            sx={{
                display: "list-item",
                padding: 0,
                color: node.indicator && (node.severity ?? "default") !== "default" ? undefined : getSeverityColor(node.severity, theme),
                listStyleType: (node.severity ?? "default") !== "default" ? undefined : "inherit",
                "::marker": {
                    color: getSeverityColor(node.severity, theme),
                },
                border: node.indicator && (node.severity ?? "default") !== "default" ? `1px solid ${getSeverityColor(node.severity, theme)}` : undefined,
                borderLeft: node.indicator && (node.severity ?? "default") !== "default" ? `4px solid ${getSeverityColor(node.severity, theme)}` : undefined,
                borderRadius: node.indicator && (node.severity ?? "default") !== "default" ? 1 : undefined,
            }}
        >
            <RichRenderer node={node.content} defaults={defaults} textVariant="body" />
            {children}
        </ListItem>
    );
};

interface RichListProps {
    node: Optional<IRichList, "type" | "items">;
    defaults?: IRichContainerDefaults;
    children?: React.ReactNode;
}

const RichList: React.FC<RichListProps> = ({ node, defaults, children }) => {
    const getListStyleType = (listType?: "bullet" | "numbered" | "none") => {
        switch (listType) {
            case "numbered":
                return "decimal";
            case "bullet":
                return "disc";
            default:
                return "none";
        }
    };

    return (
        <List
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichContainer-list", node.className)}
            style={node.style}
            sx={{
                listStyleType: getListStyleType(node.listType),
                padding: defaults?.padding ?? 8,
                paddingLeft: node.listType && node.listType !== "none" ? "24px" : "0px",
                margin: 0,
                "& > li.indicator + li.indicator": {
                    marginTop: defaults?.gap ?? 4,
                },
            }}
        >
            {node.items?.map((item, index) => (
                <RichListItem key={index} node={item} defaults={defaults} />
            ))}
            {children}
        </List>
    );
};

export default RichList;
