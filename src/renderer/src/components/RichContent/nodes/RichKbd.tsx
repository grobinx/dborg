import React from "react";
import { IRichContainerDefaults, IRichKbd } from "../types";
import { Shortcut } from "@renderer/components/Shortcut";
import { Optional } from "@renderer/types/universal";

interface RichKbdProps {
    node: Optional<IRichKbd, "type">;
    defaults?: IRichContainerDefaults;
}

const RichKbd: React.FC<RichKbdProps> = ({ node }) => {
    return (
        <Shortcut className="RichNode-kbd" keybindings={node.keys} />
    );
};

export default RichKbd;
