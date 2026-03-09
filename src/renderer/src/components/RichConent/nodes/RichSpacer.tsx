import React from "react";
import { Box } from "@mui/material";
import { IRichSpacer } from "../types";

interface RichSpacerProps {
    node: IRichSpacer;
}

const RichSpacer: React.FC<RichSpacerProps> = ({ node }) => {
    const getSize = (size?: number | string | "auto") => {
        if (size === "auto") {
            return 1; // flex: 1
        }
        return size;
    };

    const sizeValue = getSize(node.size);

    return (
        <Box
            sx={{
                flex: typeof sizeValue === "number" ? (node.size === "auto" ? 1 : undefined) : undefined,
                width: typeof sizeValue === "string" ? sizeValue : undefined,
                height: typeof sizeValue === "string" ? sizeValue : undefined,
            }}
        />
    );
};

export default RichSpacer;
