import React from "react";
import { Box } from "@mui/material";
import { IRichRow, RichNode } from "../types";
const RichRenderer = React.lazy(() => import("../index").then(m => ({ default: m.RichRenderer })));

interface RichRowProps {
    node: IRichRow;
}

const RichRow: React.FC<RichRowProps> = ({ node }) => {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "row",
                gap: node.gap || "8px",
                alignItems: node.align || "start",
                justifyContent: node.justify || "start",
                width: "100%",
                flexWrap: "wrap",
            }}
        >
            {node.items.map((item, index) => (
                <Box key={index} sx={{ flex: "1 1 auto", minWidth: 0 }}>
                    <React.Suspense fallback={<Box>...</Box>}>
                        <RichRenderer node={item} />
                    </React.Suspense>
                </Box>
            ))}
        </Box>
    );
};

export default RichRow;
