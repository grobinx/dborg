import React from "react";
import { List } from "@mui/material";
import { IRichContainerDefaults, IRichList } from "../types";
const RichRenderer = React.lazy(() => import("../index").then(m => ({ default: m.RichRenderer })));

interface RichListProps {
    node: IRichList;
    defaults?: IRichContainerDefaults;
}

const RichList: React.FC<RichListProps> = ({ node, defaults }) => {
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
                padding: defaults?.padding ?? 8,
                paddingLeft: node.listType && node.listType !== "none" ? "24px" : "0px",
                margin: 0,
                "& > li.indicator + li.indicator": {
                    marginTop: defaults?.gap ?? 8,
                },
            }}
        >
            {node.items.map((item, index) => (
                <RichRenderer key={index} node={item} defaults={defaults} />
            ))}
        </List>
    );
};

export default RichList;
