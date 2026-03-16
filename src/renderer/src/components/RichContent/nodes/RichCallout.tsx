import React from "react";
import { IRichCallout, IRichContainerDefaults } from "../types";
import RichRenderer from "..";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import CalloutBox from "../utils/CalloutBox";
import Tooltip from "@renderer/components/Tooltip";

interface RichCalloutProps {
    node: Optional<IRichCallout, "type">;
    defaults?: IRichContainerDefaults;
    children?: React.ReactNode;
}

const RichCallout: React.FC<RichCalloutProps> = ({ node, defaults, children }) => {
    if (node.excluded) {
        return null;
    }

    const result = (
        <CalloutBox
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-callout", node.className)}
            style={node.style}
            severity={node.severity}
            sx={{ p: 0, gap: 0 }}
        >
            <RichRenderer node={node.value} defaults={defaults} />
            {children}
        </CalloutBox>
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

export default RichCallout;