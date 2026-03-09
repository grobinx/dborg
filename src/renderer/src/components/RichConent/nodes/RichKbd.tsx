import React from "react";
import { IRichKbd } from "../types";
import { Shortcut } from "@renderer/components/Shortcut";

interface RichKbdProps {
    node: IRichKbd;
}

const RichKbd: React.FC<RichKbdProps> = ({ node }) => {
    return (
        <Shortcut keybindings={node.keys} />
    );
};

export default RichKbd;
