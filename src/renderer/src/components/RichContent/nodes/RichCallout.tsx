import React from "react";
import { IRichCallout, IRichContainerTheme, IRichEnvironment } from "../types";
import RichRenderer from "..";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import CalloutBox from "../utils/CalloutBox";
import Tooltip from "@renderer/components/Tooltip";

interface RichCalloutProps {
    node: Optional<IRichCallout, "type">;
    environment?: IRichEnvironment;
    children?: React.ReactNode;
}

const RichCallout: React.FC<RichCalloutProps> = ({ node, environment, children }) => {
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
            <RichRenderer node={node.value} environment={environment} />
            {children}
        </CalloutBox>
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

export default RichCallout;