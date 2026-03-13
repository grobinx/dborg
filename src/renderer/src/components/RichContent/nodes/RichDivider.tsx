import React from "react";
import { Divider } from "@mui/material";
import { IRichContainerDefaults, IRichDivider } from "../types";
import clsx from "@renderer/utils/clsx";

interface RichDividerProps {
    node: IRichDivider;
    defaults?: IRichContainerDefaults;
}

const RichDivider: React.FC<RichDividerProps> = ({ node }) => {
    return (
        <Divider
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-divider", node.className)}
            style={node.style}
            sx={{ my: 1 }}
        />
    );
};

export default RichDivider;
