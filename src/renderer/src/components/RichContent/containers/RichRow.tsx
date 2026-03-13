import React from "react";
import { Box } from "@mui/material";
import { IRichContainerDefaults, IRichRow } from "../types";
import RichRenderer from "..";
import { Optional } from "@renderer/types/universal";

interface RichRowProps {
    node: Optional<IRichRow, "type" | "items">;
    defaults?: IRichContainerDefaults;
    children?: React.ReactNode;
}

const RichRow: React.FC<RichRowProps> = ({ node, defaults, children }) => {
    return (
        <Box
            className="RichContainer-row"
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
