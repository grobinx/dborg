import React from "react";
import { Box, useTheme } from "@mui/material";
import { IRichColumn, IRichContainerDefaults, RichColSize, RichNode } from "../types";
import RichRenderer, { resolveRichValue, resolveRichValueFromFunction, RichIcon } from "..";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";

interface RichColumnProps {
    node: Optional<IRichColumn, "type">;
    defaults?: IRichContainerDefaults;
    children?: React.ReactNode;
}

const RichColumn: React.FC<RichColumnProps> = ({ node, defaults, children }) => {
    const [items, setItems] = React.useState<RichNode[] | null>(resolveRichValue(node.items));

    React.useEffect(() => {
        resolveRichValueFromFunction(node.items, setItems);
    }, [node.items]);

    const getColSize = (size?: RichColSize) => {
        if (size === "auto" || size === undefined) {
            return "auto";
        }
        return `calc(${(size / 12) * 100}% - ${(node.gap ?? defaults?.gap ?? 4)}px)`;
    };

    return (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichContainer-column", node.className)}
            style={node.style}
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: node.gap ?? defaults?.gap ?? 4,
                padding: defaults?.padding ?? 4,
                width: getColSize(node.size),
                minWidth: 0,
            }}
        >
            {items === null ?
                <RichIcon node={{ icon: "Loading" }} defaults={defaults} />
                : items.map((item, index) => (
                    <RichRenderer key={index} node={item} defaults={defaults} />
                ))
            }
            {children}
        </Box>
    );
};

export default RichColumn;
