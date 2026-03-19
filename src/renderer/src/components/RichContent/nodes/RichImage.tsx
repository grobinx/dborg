import React, { CSSProperties } from "react";
import { Box, useTheme } from "@mui/material";
import { IRichEnvironment, IRichImage } from "../types";
import clsx from "@renderer/utils/clsx";
import Tooltip from "@renderer/components/Tooltip";
import RichRenderer, { RichProp } from "..";

interface RichImageProps extends RichProp {
    node: IRichImage;
    environment?: IRichEnvironment;
}

const RichImage: React.FC<RichImageProps> = ({ node, environment }) => {
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

    if (node.excluded) {
        return null;
    }

    const shouldRepeat = !!node.repeat && node.repeat !== "no-repeat";

    if (shouldRepeat) {
        const tileSize =
            typeof node.tileSize === "number"
                ? node.tileSize + "px auto"
                : node.tileSize;

        return (
            <Box
                id={node.id}
                hidden={node.hidden}
                key={node.key ?? node.id}
                className={clsx("RichNode-image", node.className)}
                style={node.style}
                role="img"
                aria-label={node.alt || "Image"}
                sx={{
                    width: node.width ?? "auto",
                    height: node.height ?? "auto",
                    borderRadius: environment?.theme?.radius ?? 4,
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

    const result = (
        <Box
            className="RichNode-image"
            role="img"
            aria-label={node.alt || "Image"}
            sx={{
                display: "inline-block",
                borderRadius: environment?.theme?.radius ?? 4,
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

    if (node.tooltip) {
        return (
            <Tooltip title={<RichRenderer node={node.tooltip} environment={environment} />}>
                {result}
            </Tooltip>
        );
    }

    return result;

};

export default RichImage;
