import React from "react";
import { Divider } from "@mui/material";
import { IRichDivider } from "../types";

interface RichDividerProps {
    node: IRichDivider;
}

const RichDivider: React.FC<RichDividerProps> = () => {
    return <Divider sx={{ my: 1 }} />;
};

export default RichDivider;
