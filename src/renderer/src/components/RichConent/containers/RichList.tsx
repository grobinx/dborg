import React from "react";
import { List, useTheme } from "@mui/material";
import { IRichList } from "../types";
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
            <RichRenderer node={node.items} />
        </List>
    );
};

export default RichList;
