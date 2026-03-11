import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichText, RichSeverity, RichTextVariant } from "../types";
import { getSeverityColor } from "..";
import { FormattedText } from "@renderer/components/useful/FormattedText";
import Markdown from "react-markdown";

interface RichTextProps {
    node: IRichText;
    defaults?: IRichContainerDefaults;
}

const RichText: React.FC<RichTextProps> = ({ node }) => {
    const theme = useTheme();

    const getVariantMapping = (variant?: RichTextVariant) => {
        switch (variant) {
            case "body":
                return "body1";
            case "caption":
                return "subtitle2";
            case "label":
                return "label";
            case "title":
                return "h6";
            case "description":
                return "description";
            default:
                return "body2";
        }
    };

    if (node.variant === "markdown") {
        return (
            <Box sx={{ color: getSeverityColor(node.severity, theme) }}>
                <Markdown>{node.text}</Markdown>
            </Box>
        )
    }

    return (
        <Typography
            variant={getVariantMapping(node.variant) as any}
            sx={{ color: getSeverityColor(node.severity, theme) }}
        >
            {node.text}
        </Typography>
    );
};

export default RichText;
