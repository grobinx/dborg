import React from "react";
import { Box, Tooltip, useTheme } from "@mui/material";
import { IRichContainerTheme, IRichEnvironment, IRichIcon, RichSeverity } from "../types";
import { resolveIcon } from "@renderer/themes/icons";
import RichRenderer, { getSeverityColor, RichProp } from "..";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";

interface RichIconProps extends RichProp {
    node: Optional<IRichIcon, "type">;
    environment?: IRichEnvironment;
}

const RichIcon: React.FC<RichIconProps> = ({ node, environment }) => {
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
            <Tooltip title={<RichRenderer node={node.tooltip} environment={environment} />}>
                {result}
            </Tooltip>
        );
    }

    return result;
};

export default RichIcon;
