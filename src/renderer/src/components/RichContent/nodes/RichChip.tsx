import React from "react";
import { Chip, Box, useTheme } from "@mui/material";
import { IRichChip, IRichContainerDefaults, RichSeverity } from "../types";
import RichBadge from "./RichBadge";
import RichRenderer from "..";
import { Optional } from "@renderer/types/universal";

interface RichChipProps {
    node: Optional<IRichChip, "type">;
    defaults?: IRichContainerDefaults;
}

const RichChip: React.FC<RichChipProps> = ({ node, defaults }) => {
    const theme = useTheme();

    return (
        <Box className="RichNode-chip" sx={{ display: "inline-block", position: "relative", alignSelf: "flex-start" }}>
            <Chip
                label={<RichRenderer node={node.text} defaults={defaults} />}
                size="small"
                sx={{
                    paddingRight: node.badge ? (defaults?.padding ?? 8) : undefined,
                    fontSize: "inherit",
                    fontFamily: "inherit",
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
