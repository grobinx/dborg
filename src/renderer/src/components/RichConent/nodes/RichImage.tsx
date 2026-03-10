import React from "react";
import { Box, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichImage } from "../types";

interface RichImageProps {
    node: IRichImage;
    defaults?: IRichContainerDefaults;
}

const RichImage: React.FC<RichImageProps> = ({ node, defaults }) => {
    const theme = useTheme();

    const getObjectFit = (fit?: string) => {
        switch (fit) {
            case "cover":
                return "cover";
            case "fill":
                return "fill";
            case "none":
                return "none";
            case "scale-down":
                return "scale-down";
            default:
                return "contain";
        }
    };

    return (
        <Box
            sx={{
                display: "inline-block",
                borderRadius: defaults?.radius ?? 4,
                border: `1px solid ${theme.palette.divider}`,
                overflow: "hidden",
                maxWidth: "100%",
            }}
        >
            <img
                src={node.src}
                alt={node.alt || "Image"}
                style={{
                    width: node.width ? `${node.width}` : "auto",
                    height: node.height ? `${node.height}` : "auto",
                    objectFit: getObjectFit(node.fit),
                    display: "block",
                    maxWidth: "100%",
                }}
            />
        </Box>
    );
};

export default RichImage;
