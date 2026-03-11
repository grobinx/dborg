import React from "react";
import { Link, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichLink, RichSeverity } from "../types";
import { getSeverityColor } from "..";

interface RichLinkProps {
    node: IRichLink;
    defaults?: IRichContainerDefaults;
}

const RichLink: React.FC<RichLinkProps> = ({ node }) => {
    const theme = useTheme();

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
            className="RichNode-link"
            href={node.href}
            target="_blank"
            rel="noopener noreferrer"
            variant={getVariantMapping(node.variant) as any}
            sx={{ color: getSeverityColor(node.severity, theme) }}
        >
            {node.text || node.href}
        </Link>
    );
};

export default RichLink;
