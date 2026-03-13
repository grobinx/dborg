import React from "react";
import { Box, useTheme } from "@mui/material";
import { IRichColumn, IRichContainerDefaults, RichColSize } from "../types";
import RichRenderer from "..";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";

interface RichColumnProps {
    node: Optional<IRichColumn, "type" | "items">;
    defaults?: IRichContainerDefaults;
    children?: React.ReactNode;
}

const RichColumn: React.FC<RichColumnProps> = ({ node, defaults, children }) => {
    const theme = useTheme();

    const getColSize = (size?: RichColSize) => {
        if (size === "auto" || size === undefined) {
            return "auto";
        }
        return `calc(${(size / 12) * 100}% - ${(node.gap ?? defaults?.gap ?? 4)}px)`;
    };

    return (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichContainer-column", node.className)}
            style={node.style}
            sx={{
                display: "flex",
                flexDirection: "column",
                gap: node.gap ?? defaults?.gap ?? 4,
                padding: defaults?.padding ?? 4,
                width: getColSize(node.size),
                minWidth: 0,
            }}
        >
            {node.items?.map((item, index) => (
                <RichRenderer key={index} node={item} defaults={defaults} />
            ))}
            {children}
        </Box>
    );
};

export default RichColumn;
