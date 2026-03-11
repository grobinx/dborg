import React, { CSSProperties } from "react";
import { Box, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichImage } from "../types";

interface RichImageProps {
    node: IRichImage;
    defaults?: IRichContainerDefaults;
}

const RichImage: React.FC<RichImageProps> = ({ node, defaults }) => {
    const theme = useTheme();

    const getObjectFit = (fit?: IRichImage["fit"]): CSSProperties["objectFit"] => {
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

    const shouldRepeat = !!node.repeat && node.repeat !== "no-repeat";

    if (shouldRepeat) {
        const tileSize =
            typeof node.tileSize === "number"
                ? node.tileSize + "px auto"
                : node.tileSize;

        return (
            <Box
                className="RichNode-image"
                role="img"
                aria-label={node.alt || "Image"}
                sx={{
                    width: node.width ?? "auto",
                    height: node.height ?? "auto",
                    borderRadius: defaults?.radius ?? 4,
                    border: "1px solid " + theme.palette.divider,
                    overflow: "hidden",
                    maxWidth: "100%",
                    backgroundImage: 'url("' + node.src + '")',
                    backgroundRepeat: node.repeat,
                    backgroundPosition: "center",
                    backgroundSize:
                        tileSize ?? (node.fit === "fill" ? "100% 100%" : "auto"),
                }}
            />
        );
    }

    return (
        <Box
            className="RichNode-image"
            role="img"
            aria-label={node.alt || "Image"}
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
                    width: node.width ?? "auto",
                    height: node.height ?? "auto",
                    objectFit: getObjectFit(node.fit),
                    display: "block",
                    objectPosition: "center",
                    maxWidth: "100%",
                }}
            />
        </Box>
    );
};

export default RichImage;
