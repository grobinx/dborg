import React from "react";
import { List, ListItem, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichList, IRichListItem, RichNode } from "../types";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import RichRenderer, { getSeverityColor, resolveRichValue, resolveRichValueFromFunction, RichIcon } from "..";
import SeverityBox from "../utils/SeverityBox";

interface RichListItemProps {
    node: IRichListItem;
    defaults?: IRichContainerDefaults;
    children?: React.ReactNode;
}

const RichListItem: React.FC<RichListItemProps> = ({ node, defaults, children }) => {
    const theme = useTheme();
    const [content, setContent] = React.useState<RichNode | null>(resolveRichValue(node.content));

    React.useEffect(() => {
        resolveRichValueFromFunction<RichNode>(node.content, setContent);
    }, [node.content]);

    return (
        <SeverityBox
            component={"li"}
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx(
                "RichContainer-listItem",
                (node.indicator && (node.severity ?? "default") !== "default") && "indicator",
                node.className
            )}
            style={node.style}
            severity={node.indicator ? (node.severity ?? "default") : undefined}
            sx={{
                display: "list-item",
                padding: node.padding ?? "0px 4px",
                color: node.indicator && (node.severity ?? "default") !== "default" ? undefined : getSeverityColor(node.severity, theme),
                listStyleType: (node.severity ?? "default") !== "default" ? undefined : "inherit",
                "::marker": {
                    color: getSeverityColor(node.severity, theme),
                },
            }}
        >
            {content === null ?
                <RichIcon node={{ icon: "Loading" }} defaults={defaults} />
                : <RichRenderer node={content} defaults={defaults} textVariant="body" />
            }
            {children}
        </SeverityBox>
    );
};

interface RichListProps {
    node: Optional<IRichList, "type">;
    defaults?: IRichContainerDefaults;
    children?: React.ReactNode;
}

const RichList: React.FC<RichListProps> = ({ node, defaults, children }) => {
    const [items, setItems] = React.useState<IRichListItem[] | null>(resolveRichValue(node.items));

    React.useEffect(() => {
        resolveRichValueFromFunction(node.items, setItems);
    }, [node.items]);

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
            {items === null ?
                <RichIcon node={{ icon: "Loading" }} defaults={defaults} />
                : items.map((item, index) => (
                    <RichListItem key={index} node={item} defaults={defaults} />
                ))
            }
            {children}
        </List>
    );
};

export default RichList;
