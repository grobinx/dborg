import React from "react";
import { Box } from "@mui/material";
import { IRichRow } from "../types";
import RichRenderer from "..";

interface RichRowProps {
    node: IRichRow;
}

const RichRow: React.FC<RichRowProps> = ({ node }) => {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "row",
                gap: node.gap ?? 4,
                alignItems: node.align || "start",
                justifyContent: node.justify || "start",
                width: "100%",
                flexWrap: "wrap",
            }}
        >
            <RichRenderer node={node.items} />
        </Box>
    );
};

export default RichRow;
