import React from "react";
import { Link, useTheme } from "@mui/material";
import { IRichLink, RichSeverity } from "../types";

interface RichLinkProps {
    node: IRichLink;
}

const RichLink: React.FC<RichLinkProps> = ({ node }) => {
    const theme = useTheme();

    const getSeverityColor = (severity?: RichSeverity): string => {
        switch (severity) {
            case "error":
                return theme.palette.error.main;
            case "warning":
                return theme.palette.warning.main;
            case "success":
                return theme.palette.success.main;
            case "info":
                return theme.palette.info.main;
            default:
                return theme.palette.primary.main;
        }
    };

    const getVariantMapping = (variant?: string) => {
        switch (variant) {
            case "body":
                return "body1";
            case "caption":
                return "caption";
            case "label":
                return "subtitle2";
            case "title":
                return "h6";
            default:
                return "body2";
        }
    };

    return (
        <Link
            href={node.href}
            target="_blank"
            rel="noopener noreferrer"
            variant={getVariantMapping(node.variant) as any}
            sx={{ color: getSeverityColor(node.severity) }}
        >
            {node.text || node.href}
        </Link>
    );
};

export default RichLink;
