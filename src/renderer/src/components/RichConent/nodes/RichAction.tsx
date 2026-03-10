import React from "react";
import { Box } from "@mui/material";
import { IRichAction } from "../types";
import RichBadge from "./RichBadge";
import { Button } from "@renderer/components/buttons/Button";

interface RichActionProps {
    node: IRichAction;
}

const RichAction: React.FC<RichActionProps> = ({ node }) => {
    const content = (
        <Box sx={{ display: "inline-block", position: "relative" }}>
            <Button action={node} color={node.severity} />
            {node.badge && (
                <Box
                    sx={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                    }}
                >
                    <RichBadge badge={node.badge} />
                </Box>
            )}
        </Box>
    );

    return content;
};

export default RichAction;
