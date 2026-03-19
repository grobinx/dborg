import React from "react";
import { List, useTheme } from "@mui/material";
import { IRichEnvironment, IRichList, IRichListItem, RichNode } from "../types";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import RichRenderer, { getSeverityColor, resolveRichValue, resolveRichValueFromFunction, RichIcon, RichProp } from "..";
import CalloutBox from "../utils/CalloutBox";
import Tooltip from "@renderer/components/Tooltip";

interface RichListItemProps extends RichProp {
    node: IRichListItem;
    environment?: IRichEnvironment;
    children?: React.ReactNode;
}

const RichListItem: React.FC<RichListItemProps> = ({ node, environment, children, refreshId }) => {
    const theme = useTheme();
    const [content, setContent] = React.useState<RichNode | null>(resolveRichValue(node.content));

    React.useEffect(() => {
        resolveRichValueFromFunction<RichNode>(node.content, setContent, node);
    }, [node.content, refreshId]);

    if (node.excluded) {
        return null;
    }

    const result = (
        <CalloutBox
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
                padding: environment?.theme?.padding ?? node.padding ?? "0px 4px",
                color: node.indicator && (node.severity ?? "default") !== "default" ? undefined : getSeverityColor(node.severity, theme),
                listStyleType: (node.severity ?? "default") !== "default" ? undefined : "inherit",
                "::marker": {
                    color: getSeverityColor(node.severity, theme),
                },
            }}
        >
            {content === null ?
                <RichIcon node={{ icon: "Loading" }} environment={environment} />
                : <RichRenderer node={content} environment={environment} textVariant="body" />
            }
            {children}
        </CalloutBox>
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

interface RichListProps extends RichProp {
    node: Optional<IRichList, "type">;
    environment?: IRichEnvironment;
    children?: React.ReactNode;
}

const RichList: React.FC<RichListProps> = ({ node, environment, children, refreshId }) => {
    const [items, setItems] = React.useState<IRichListItem[] | null>(resolveRichValue(node.items));

    React.useEffect(() => {
        resolveRichValueFromFunction(node.items, setItems, node);
    }, [node.items, refreshId]);

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
                padding: environment?.theme?.padding ?? 8,
                paddingLeft: node.listType && node.listType !== "none" ? "24px" : "0px",
                margin: 0,
                "& > li.indicator + li.indicator": {
                    marginTop: environment?.theme?.gap ?? 4,
                },
            }}
        >
            {items === null ?
                <RichIcon node={{ icon: "Loading" }} environment={environment} />
                : items.map((item, index) => (
                    <RichListItem key={index} node={item} environment={environment} />
                ))
            }
            {children}
        </List>
    );
};

export default RichList;
