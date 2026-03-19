import React from "react";
import { Link, useTheme } from "@mui/material";
import { IRichEnvironment, IRichLink } from "../types";
import RichRenderer, { getSeverityColor, RichProp } from "..";
import clsx from "@renderer/utils/clsx";
import Tooltip from "@renderer/components/Tooltip";

interface RichLinkProps extends RichProp {
    node: IRichLink;
    environment?: IRichEnvironment;
}

const RichLink: React.FC<RichLinkProps> = ({ node, environment }) => {
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

    if (node.excluded) {
        return null;
    }

    const result = (
        <Link
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-link", node.className)}
            style={node.style}
            href={node.href}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "inherit", fontSize: "inherit", fontFamily: "inherit", fontWeight: "inherit" }}
        >
            {node.text || node.href}
        </Link>
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

export default RichLink;
