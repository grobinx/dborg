import React from "react";
import { Box } from "@mui/material";
import { IRichColumn } from "../types";
import RichRenderer from "..";

interface RichColumnProps {
    node: IRichColumn;
}

const RichColumn: React.FC<RichColumnProps> = ({ node }) => {
    const getColSize = (size?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | "auto") => {
        if (size === "auto" || size === undefined) {
            return "auto";
        }
        return `${(size / 12) * 100}%`;
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: node.gap ?? 4,
                width: getColSize(node.size),
                minWidth: 0,
            }}
        >
            <RichRenderer node={node.items} />
        </Box>
    );
};

export default RichColumn;
