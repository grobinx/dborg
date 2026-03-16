import React from "react";
import { Divider } from "@mui/material";
import { IRichContainerDefaults, IRichDivider } from "../types";
import clsx from "@renderer/utils/clsx";
import Tooltip from "@renderer/components/Tooltip";
import RichRenderer from "..";

interface RichDividerProps {
    node: IRichDivider;
    defaults?: IRichContainerDefaults;
}

const RichDivider: React.FC<RichDividerProps> = ({ node, defaults }) => {

    if (node.excluded) {
        return null;
    }
    
    const result = (
        <Divider
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-divider", node.className)}
            style={node.style}
            sx={{ my: 1 }}
        />
    );

    if (node.tooltip) {
        return (
            <Tooltip title={<RichRenderer node={node.tooltip} defaults={defaults} />}>
                {result}
            </Tooltip>
        );
    }

    return result;

};

export default RichDivider;
