import React from "react";
import { Divider } from "@mui/material";
import { IRichContainerDefaults, IRichDivider } from "../types";

interface RichDividerProps {
    node: IRichDivider;
    defaults?: IRichContainerDefaults;
}

const RichDivider: React.FC<RichDividerProps> = () => {
    return <Divider className="RichNode-divider" sx={{ my: 1 }} />;
};

export default RichDivider;
