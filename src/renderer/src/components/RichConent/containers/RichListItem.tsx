import React from "react";
import { ListItem, useTheme } from "@mui/material";
import { IRichListItem } from "../types";
import RichRenderer, { getSeverityColor } from "../index";

interface RichListItemProps {
    node: IRichListItem;
}

const RichListItem: React.FC<RichListItemProps> = ({ node }) => {
    const theme = useTheme();

    return (
        <ListItem
            sx={{
                display: "list-item",
                padding: "4px 0",
                color: getSeverityColor(node.severity, theme),
                listStyleType: node.severity ? undefined : "inherit",
                "::marker": {
                    color: getSeverityColor(node.severity, theme),
                },
            }}
        >
            <RichRenderer node={node.content} />
        </ListItem>
    );
};

export default RichListItem;
