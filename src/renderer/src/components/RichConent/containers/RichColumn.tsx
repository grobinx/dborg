import React from "react";
import { Box, useTheme } from "@mui/material";
import { IRichColumn, IRichContainerDefaults } from "../types";
import RichRenderer from "..";

interface RichColumnProps {
    node: IRichColumn;
    defaults?: IRichContainerDefaults;
}

const RichColumn: React.FC<RichColumnProps> = ({ node, defaults }) => {
    const theme = useTheme();

    const getColSize = (size?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | "auto") => {
        if (size === "auto" || size === undefined) {
            return "auto";
        }
        return `${(size / 12) * 100}%`;
    };

    return (
        <Box
            className="RichContainer-column"
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: node.gap ?? defaults?.gap ?? 4,
                padding: defaults?.padding ?? 4,
                width: getColSize(node.size),
                minWidth: 0,
            }}
        >
            {node.items.map((item, index) => (
                <RichRenderer key={index} node={item} defaults={defaults} />
            ))}
        </Box>
    );
};

export default RichColumn;
