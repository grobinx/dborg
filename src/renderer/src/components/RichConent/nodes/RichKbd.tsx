import React from "react";
import { IRichContainerDefaults, IRichKbd } from "../types";
import { Shortcut } from "@renderer/components/Shortcut";

interface RichKbdProps {
    node: IRichKbd;
    defaults?: IRichContainerDefaults;
}

const RichKbd: React.FC<RichKbdProps> = ({ node }) => {
    return (
        <Shortcut className="RichNode-kbd" keybindings={node.keys} />
    );
};

export default RichKbd;
