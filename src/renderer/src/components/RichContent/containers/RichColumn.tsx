import React from "react";
import { Box } from "@mui/material";
import { IRichColumn, IRichEnvironment, RichColSize, RichNode } from "../types";
import RichRenderer, { resolveRichValue, resolveRichValueFromFunction, RichIcon, RichProp } from "..";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import Tooltip from "@renderer/components/Tooltip";

interface RichColumnProps extends RichProp {
    node: Optional<IRichColumn, "type">;
    environment?: IRichEnvironment;
    children?: React.ReactNode;
}

const RichColumn: React.FC<RichColumnProps> = ({ node, environment, children, refreshId }) => {
    const [items, setItems] = React.useState<RichNode[] | null>(resolveRichValue(node.items));

    React.useEffect(() => {
        resolveRichValueFromFunction(node.items, setItems, node);
    }, [node.items, refreshId]);

    const getColSize = (size?: RichColSize) => {
        if (size === "auto" || size === "stretch" || size === undefined) {
            return "auto";
        }
        return `calc(${(size / 12) * 100}% - ${(node.gap ?? environment?.theme?.gap ?? 4)}px)`;
    };

    if (node.excluded) {
        return null;
    }

    const result = (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichContainer-column", node.className)}
            style={node.style}
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: node.gap ?? environment?.theme?.gap ?? 4,
                padding: node.padding ?? environment?.theme?.padding ?? 4,
                width: node.size === "stretch" ? "100%" : getColSize(node.size),
                flexGrow: node.size === "stretch" ? 1 : undefined,
                minWidth: 0,
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

export default RichColumn;
