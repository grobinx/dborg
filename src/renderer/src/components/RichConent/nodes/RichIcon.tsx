import React from "react";
import { Box, Tooltip, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichIcon, RichSeverity } from "../types";
import { resolveIcon } from "@renderer/themes/icons";
import { getSeverityColor } from "..";
import { Optional } from "@renderer/types/universal";

interface RichIconProps {
    node: Optional<IRichIcon, "type">;
    defaults?: IRichContainerDefaults;
}

const RichIcon: React.FC<RichIconProps> = ({ node }) => {
    const theme = useTheme();

    const content = (
        <Box
            className="RichNode-icon"
            sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: getSeverityColor(node.severity, theme),
                alignSelf: "center",
            }}
        >
            {resolveIcon(theme, node.icon)}
        </Box>
    );

    if (node.tooltip) {
        return <Tooltip title={node.tooltip}>{content}</Tooltip>;
    }

    return content;
};

export default RichIcon;
