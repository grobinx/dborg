import React from "react";
import { IRichContainerDefaults, IRichKbd } from "../types";
import { Shortcut } from "@renderer/components/Shortcut";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";

interface RichKbdProps {
    node: Optional<IRichKbd, "type">;
    defaults?: IRichContainerDefaults;
}

const RichKbd: React.FC<RichKbdProps> = ({ node }) => {
    return (
        <Shortcut
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-kbd", node.className)}
            style={node.style}
            keybindings={node.keys}
        />
    );
};

export default RichKbd;
