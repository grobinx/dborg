import React from "react";
import { IRichSurface, IRichEnvironment } from "../types";
import RichRenderer, { RichProp } from "..";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import SurfaceBox from "../utils/SurfaceBox";
import Tooltip from "@renderer/components/Tooltip";

interface RichSurfaceProps extends RichProp {
    node: Optional<IRichSurface, "type">;
    environment?: IRichEnvironment;
    children?: React.ReactNode;
}

const RichSurface: React.FC<RichSurfaceProps> = ({ node, environment, children }) => {
    if (node.excluded) {
        return null;
    }

    const result = (
        <SurfaceBox
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-surface", node.className)}
            style={node.style}
            severity={node.severity}
            variant={node.variant}
            animated={node.animated}
            sx={{ p: 0, gap: 0 }}
        >
            <RichRenderer node={node.value} environment={environment} />
            {children}
        </SurfaceBox>
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

export default RichSurface;