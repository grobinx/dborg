import React from "react";
import { Box } from "@mui/material";
import { IRichAction, IRichContainerDefaults } from "../types";
import RichBadge from "./RichBadge";
import { Button } from "@renderer/components/buttons/Button";
import { ToolButton } from "@renderer/components/buttons/ToolButton";
import clsx from "@renderer/utils/clsx";

interface RichActionProps {
    node: IRichAction;
    defaults?: IRichContainerDefaults;
}

const RichAction: React.FC<RichActionProps> = ({ node, defaults }) => {
    const content = (
        <Box 
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-action", node.className)}
            style={node.style}
            sx={{ display: "inline-block", position: "relative", alignSelf: "flex-start" }}
            >
            {node.variant === "icon" ? (
                <ToolButton action={node} color={node.severity} size="small" />
            ) : (
                <Button action={node} color={node.severity} size="small" />
            )}
            {node.badge && (
                <Box
                    sx={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                    }}
                >
                    <RichBadge badge={node.badge} defaults={defaults} />
                </Box>
            )}
        </Box>
    );

    return content;
};

export default RichAction;
