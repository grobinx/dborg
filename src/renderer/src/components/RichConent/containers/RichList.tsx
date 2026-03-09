import React from "react";
import { Box, List, ListItem as MuiListItem, ListItemText, useTheme } from "@mui/material";
import { IRichList, RichSeverity } from "../types";
const RichRenderer = React.lazy(() => import("../index").then(m => ({ default: m.RichRenderer })));

interface RichListProps {
    node: IRichList;
}

const RichList: React.FC<RichListProps> = ({ node }) => {
    const theme = useTheme();

    const getListStyleType = (listType?: "bullet" | "numbered" | "none") => {
        switch (listType) {
            case "numbered":
                return "decimal";
            case "bullet":
                return "disc";
            default:
                return "none";
        }
    };

    return (
        <List
            sx={{
                listStyleType: getListStyleType(node.listType),
                paddingLeft: node.listType && node.listType !== "none" ? "24px" : "0px",
                margin: 0,
            }}
        >
            {node.items.map((item, index) => (
                <div key={index}>
                    <React.Suspense fallback={<Box>...</Box>}>
                        <RichRenderer node={item} />
                    </React.Suspense>
                </div>
            ))}
        </List>
    );
};

export default RichList;
