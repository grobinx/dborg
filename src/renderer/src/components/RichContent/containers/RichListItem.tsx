import React from "react";
import { ListItem, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichListItem } from "../types";
import RichRenderer, { getSeverityColor, RichText } from "../index";
import clsx from "@renderer/utils/clsx";
import { Optional } from "@renderer/types/universal";

interface RichListItemProps {
    node: IRichListItem;
    defaults?: IRichContainerDefaults;
    children?: React.ReactNode;
}

const RichListItem: React.FC<RichListItemProps> = ({ node, defaults, children }) => {
    const theme = useTheme();

    return (
        <ListItem
            className={clsx(
                "RichContainer-listItem",
                (node.indicator && (node.severity ?? "default") !== "default") && "indicator"
            )}
            sx={{
                display: "list-item",
                padding: defaults?.padding ?? 4,
                color: node.indicator && (node.severity ?? "default") !== "default" ? undefined : getSeverityColor(node.severity, theme),
                listStyleType: (node.severity ?? "default") !== "default" ? undefined : "inherit",
                "::marker": {
                    color: getSeverityColor(node.severity, theme),
                },
                border: node.indicator && (node.severity ?? "default") !== "default" ? `1px solid ${getSeverityColor(node.severity, theme)}` : undefined,
                borderLeft: node.indicator && (node.severity ?? "default") !== "default" ? `4px solid ${getSeverityColor(node.severity, theme)}` : undefined,
                borderRadius: node.indicator && (node.severity ?? "default") !== "default" ? 1 : undefined,
            }}
        >
            {typeof node.content === "string" || typeof node.content === "number" ? (
                <RichText node={{ text: node.content, variant: "body" }} defaults={defaults} />
            ) : (
                <RichRenderer node={node.content} defaults={defaults} />
            )}
            {children}
        </ListItem>
    );
};

export default RichListItem;
