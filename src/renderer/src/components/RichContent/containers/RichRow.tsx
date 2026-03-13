import React from "react";
import { Box } from "@mui/material";
import { IRichContainerDefaults, IRichRow } from "../types";
import RichRenderer from "..";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";

interface RichRowProps {
    node: Optional<IRichRow, "type" | "items">;
    defaults?: IRichContainerDefaults;
    children?: React.ReactNode;
}

const RichRow: React.FC<RichRowProps> = ({ node, defaults, children }) => {
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
            }}
        >
            {node.items?.map((item: typeof node.items[number], index: number) => (
                <RichRenderer key={index} node={item} defaults={defaults} />
            ))}
            {children}
        </Box>
    );
};

export default RichRow;
