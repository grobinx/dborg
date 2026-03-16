import React from "react";
import { Box, Tooltip, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichIcon, RichSeverity } from "../types";
import { resolveIcon } from "@renderer/themes/icons";
import RichRenderer, { getSeverityColor } from "..";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";

interface RichIconProps {
    node: Optional<IRichIcon, "type">;
    defaults?: IRichContainerDefaults;
}

const RichIcon: React.FC<RichIconProps> = ({ node, defaults }) => {
    const theme = useTheme();

    if (node.excluded) {
        return null;
    }

    const result = (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-icon", node.className)}
            style={node.style}
            sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: getSeverityColor(node.severity, theme),
                alignSelf: "center",
                fontSize: node.size === "small" ? "0.75em" : node.size === "large" ? "1.6em" : undefined,
            }}
        >
            {resolveIcon(theme, node.icon)}
        </Box>
    );

    if (node.tooltip) {
        return (
            <Tooltip title={<RichRenderer node={node.tooltip} defaults={defaults} />}>
                {result}
            </Tooltip>
        );
    }

    return result;
};

export default RichIcon;
