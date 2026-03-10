import React from "react";
import { Box, Tooltip, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichIcon, RichSeverity } from "../types";
import { resolveIcon } from "@renderer/themes/icons";
import { getSeverityColor } from "..";

interface RichIconProps {
    node: IRichIcon;
    defaults?: IRichContainerDefaults;
}

const RichIcon: React.FC<RichIconProps> = ({ node }) => {
    const theme = useTheme();

    const content = (
        <Box
            sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                color: getSeverityColor(node.severity, theme),
                alignSelf: "flex-start"
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
