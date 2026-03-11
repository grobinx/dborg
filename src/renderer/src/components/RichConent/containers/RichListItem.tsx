import React from "react";
import { ListItem, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichListItem } from "../types";
import RichRenderer, { getSeverityColor } from "../index";
import clsx from "@renderer/utils/clsx";

interface RichListItemProps {
    node: IRichListItem;
    defaults?: IRichContainerDefaults;
}

const RichListItem: React.FC<RichListItemProps> = ({ node, defaults }) => {
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
            {node.items.map((item, index) => (
                <RichRenderer key={index} node={item} defaults={defaults} />
            ))}
        </ListItem>
    );
};

export default RichListItem;
