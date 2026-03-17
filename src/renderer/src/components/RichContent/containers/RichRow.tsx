import React from "react";
import { Box } from "@mui/material";
import { IRichEnvironment, IRichRow, RichNode } from "../types";
import RichRenderer, { resolveRichValue, resolveRichValueFromFunction, RichIcon } from "..";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import Tooltip from "@renderer/components/Tooltip";

interface RichRowProps {
    node: Optional<IRichRow, "type">;
    environment?: IRichEnvironment;
    children?: React.ReactNode;
}

const RichRow: React.FC<RichRowProps> = ({ node, environment, children }) => {
    const [items, setItems] = React.useState<RichNode[] | null>(resolveRichValue(node.items));

    React.useEffect(() => {
        resolveRichValueFromFunction(node.items, setItems);
    }, [node.items]);

    if (node.excluded) {
        return null;
    }

    const result = (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichContainer-row", node.className)}
            style={node.style}
            sx={{
                display: "flex",
                flexDirection: "row",
                gap: node.layout === "grid" ? undefined : ((node as any).gap ?? environment?.theme?.gap ?? 4),
                alignItems: node.align || "start",
                justifyContent: node.justify || "start",
                width: "100%",
                flexWrap: "wrap",
                ...(node.layout === "grid" && (node as any).gridTemplateColumns && {
                    display: "grid",
                    gridTemplateColumns: (node as any).gridTemplateColumns || `repeat(${items ? items.length : 1}, auto)`,
                    gap: (node as any).gap ?? environment?.theme?.gap ?? 4,
                }),
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

export default RichRow;
