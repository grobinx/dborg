import React from "react";
import { Box, ListItem as MuiListItem, useTheme } from "@mui/material";
import { IRichListItem, RichSeverity } from "../types";
import { getSeverityColor } from "../index";
const RichRenderer = React.lazy(() => import("../index").then(m => ({ default: m.RichRenderer })));

interface RichListItemProps {
    node: IRichListItem;
}

const RichListItem: React.FC<RichListItemProps> = ({ node }) => {
    const theme = useTheme();

    return (
        <MuiListItem
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
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1, width: "100%" }}>
                {node.content.map((item, index) => (
                    <Box key={index}>
                        <React.Suspense fallback={<Box>...</Box>}>
                            <RichRenderer node={item} />
                        </React.Suspense>
                    </Box>
                ))}
            </Box>
        </MuiListItem>
    );
};

export default RichListItem;
