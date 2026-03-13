import React from "react";
import { Chip, Box, useTheme } from "@mui/material";
import { IRichChip, IRichContainerDefaults, RichSeverity } from "../types";
import RichBadge from "./RichBadge";
import RichRenderer, { RichText } from "..";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";

interface RichChipProps {
    node: Optional<IRichChip, "type">;
    defaults?: IRichContainerDefaults;
}

const RichChip: React.FC<RichChipProps> = ({ node, defaults }) => {
    const theme = useTheme();

    return (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-chip", node.className)}
            style={node.style}
            sx={{ display: "inline-block", position: "relative", alignSelf: "flex-start", }}
        >
            <Chip
                label={
                    typeof node.text === "string" || typeof node.text === "number"
                        ? <RichText node={{ type: "text", text: node.text, variant: "label" }} defaults={defaults} />
                        : <RichRenderer node={node.text} defaults={defaults} />
                }
                size="small"
                sx={{
                    paddingRight: node.badge ? (defaults?.padding ?? 8) : undefined,
                    fontSize: "inherit",
                    fontFamily: "inherit",
                    lineHeight: "inherit",
                    height: "auto",
                }}
                variant={node.variant}
                color={node.severity}
            />
            {node.badge && (
                <Box
                    sx={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                    }}
                >
                    <RichBadge badge={node.badge} defaults={defaults} />
                </Box>
            )}
        </Box>
    );
};

export default RichChip;
