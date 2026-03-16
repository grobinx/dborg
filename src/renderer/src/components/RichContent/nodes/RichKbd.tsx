import React from "react";
import { IRichContainerDefaults, IRichKbd } from "../types";
import { Shortcut } from "@renderer/components/Shortcut";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import Tooltip from "@renderer/components/Tooltip";
import RichRenderer from "..";

interface RichKbdProps {
    node: Optional<IRichKbd, "type">;
    defaults?: IRichContainerDefaults;
}

const RichKbd: React.FC<RichKbdProps> = ({ node, defaults }) => {

    if (node.excluded) {
        return null;
    }
    
    const result = (
        <Shortcut
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-kbd", node.className)}
            style={node.style}
            keybindings={node.keys}
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

export default RichKbd;
