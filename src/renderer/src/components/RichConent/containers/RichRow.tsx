import React from "react";
import { Box } from "@mui/material";
import { IRichContainerDefaults, IRichRow } from "../types";
import RichRenderer from "..";

interface RichRowProps {
    node: IRichRow;
    defaults?: IRichContainerDefaults;
}

const RichRow: React.FC<RichRowProps> = ({ node, defaults }) => {
    return (
        <Box
            className="RichContainer-row"
            sx={{
                display: "flex",
                flexDirection: "row",
                gap: node.layout === "grid" ? undefined : (node.gap ?? defaults?.gap ?? 4),
                alignItems: node.align || "start",
                justifyContent: node.justify || "start",
                width: "100%",
                flexWrap: "wrap",
            }}
        >
            {node.items.map((item: typeof node.items[number], index: number) => (
                <RichRenderer key={index} node={item} defaults={defaults} />
            ))}
        </Box>
    );
};

export default RichRow;
