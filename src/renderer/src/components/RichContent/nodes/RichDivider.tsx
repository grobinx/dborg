import React from "react";
import { Divider } from "@mui/material";
import { IRichDivider, IRichEnvironment } from "../types";
import clsx from "@renderer/utils/clsx";
import Tooltip from "@renderer/components/Tooltip";
import RichRenderer, { RichProp } from "..";

interface RichDividerProps extends RichProp {
    node: IRichDivider;
    environment?: IRichEnvironment;
}

const RichDivider: React.FC<RichDividerProps> = ({ node, environment }) => {

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
            <Tooltip title={<RichRenderer node={node.tooltip} environment={environment} />}>
                {result}
            </Tooltip>
        );
    }

    return result;

};

export default RichDivider;
