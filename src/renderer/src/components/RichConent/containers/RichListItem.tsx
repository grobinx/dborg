import React from "react";
import { ListItem, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichListItem } from "../types";
import RichRenderer, { getSeverityColor } from "../index";

interface RichListItemProps {
    node: IRichListItem;
    defaults?: IRichContainerDefaults;
}

const RichListItem: React.FC<RichListItemProps> = ({ node, defaults }) => {
    const theme = useTheme();

    return (
        <ListItem
            sx={{
                display: "list-item",
                padding: defaults?.padding ?? 4,
                color: getSeverityColor(node.severity, theme),
                listStyleType: node.severity ? undefined : "inherit",
                "::marker": {
                    color: getSeverityColor(node.severity, theme),
                },
            }}
        >
            {node.items.map((item, index) => (
                <RichRenderer key={index} node={item} defaults={defaults} />
            ))}
        </ListItem>
    );
};

export default RichListItem;
