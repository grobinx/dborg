import React from "react";
import { Box } from "@mui/material";
import { IRichColumn, RichNode } from "../types";
const RichRenderer = React.lazy(() => import("../index").then(m => ({ default: m.RichRenderer })));

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
                gap: node.gap || "8px",
                width: getColSize(node.size),
                minWidth: 0,
            }}
        >
            {node.items.map((item, index) => (
                <Box key={index}>
                    <React.Suspense fallback={<Box>...</Box>}>
                        <RichRenderer node={item} />
                    </React.Suspense>
                </Box>
            ))}
        </Box>
    );
};

export default RichColumn;
