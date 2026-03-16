import React from "react";
import { Box } from "@mui/material";
import { IRichContainerDefaults, IRichSpacer } from "../types";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import Tooltip from "@renderer/components/Tooltip";
import RichRenderer from "..";

interface RichSpacerProps {
    node: Optional<IRichSpacer, "type">;
    defaults?: IRichContainerDefaults;
}

const RichSpacer: React.FC<RichSpacerProps> = ({ node, defaults }) => {
    const getSize = (size?: number | string | "auto") => {
        if ((size ?? "auto") === "auto") {
            return 1; // flex: 1
        }
        return size;
    };

    if (node.excluded) {
        return null;
    }

    const sizeValue = getSize(node.size);

    const result = (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-spacer", node.className)}
            style={node.style}
            sx={{
                flex: typeof sizeValue === "number" ? ((node.size ?? "auto") === "auto" ? 1 : undefined) : undefined,
                width: typeof sizeValue === "string" ? sizeValue : undefined,
                height: typeof sizeValue === "string" ? sizeValue : undefined,
            }}
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

export default RichSpacer;
