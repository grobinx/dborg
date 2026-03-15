import React from "react";
import { Box } from "@mui/material";
import { IRichContainerDefaults, IRichRow, RichNode } from "../types";
import RichRenderer, { resolveRichValue, resolveRichValueFromFunction, RichIcon } from "..";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";

interface RichRowProps {
    node: Optional<IRichRow, "type">;
    defaults?: IRichContainerDefaults;
    children?: React.ReactNode;
}

const RichRow: React.FC<RichRowProps> = ({ node, defaults, children }) => {
    const [items, setItems] = React.useState<RichNode[] | null>(resolveRichValue(node.items));

    React.useEffect(() => {
        resolveRichValueFromFunction(node.items, setItems);
    }, [node.items]);

    return (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichContainer-row", node.className)}
            style={node.style}
            sx={{
                display: "flex",
                flexDirection: "row",
                gap: node.layout === "grid" ? undefined : ((node as any).gap ?? defaults?.gap ?? 4),
                alignItems: node.align || "start",
                justifyContent: node.justify || "start",
                width: "100%",
                flexWrap: "wrap",
                ...(node.layout === "grid" && (node as any).gridTemplateColumns && {
                    display: "grid",
                    gridTemplateColumns: (node as any).gridTemplateColumns || `repeat(${items ? items.length : 1}, auto)`,
                    gap: (node as any).gap ?? defaults?.gap ?? 4,
                }),
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

export default RichRow;
