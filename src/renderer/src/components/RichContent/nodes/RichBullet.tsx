import React from "react";
import { Box, useTheme } from "@mui/material";
import { IRichBullet, IRichEnvironment } from "../types";
import RichRenderer, { getSeverityColor, RichProp } from "..";
import clsx from "@renderer/utils/clsx";
import { Optional } from "@renderer/types/universal";
import Tooltip from "@renderer/components/Tooltip";

interface RichBulletProps extends RichProp {
    node: Optional<IRichBullet, "type">;
    environment?: IRichEnvironment;
}

const RichBullet: React.FC<RichBulletProps> = ({ node, environment }) => {
    const theme = useTheme();

    const color = getSeverityColor(node.severity, theme);
    const bulletColor = color === "inherit" ? theme.palette.text.secondary : color;

    if (node.excluded) {
        return null;
    }

    const result = (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-bullet", node.className)}
            style={node.style}
            sx={{
                display: "inline-flex",
                alignSelf: "center",
                flexShrink: 0,
                height: "100%",
            }}
        >
            <Box
                sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: bulletColor,
                    ...(node.pulse
                        ? {
                            boxShadow: `0 0 0 0 ${bulletColor}66`,
                            animation: "richBulletPulse 1.6s ease-out infinite",
                            "@keyframes richBulletPulse": {
                                "0%": { transform: "scale(1)", boxShadow: `0 0 0 0 ${bulletColor}66` },
                                "70%": { transform: "scale(1.05)", boxShadow: `0 0 0 8px transparent` },
                                "100%": { transform: "scale(1)", boxShadow: `0 0 0 0 transparent` },
                            },
                        }
                        : {}),
                }}
            />
        </Box>
    );

    if (node.tooltip) {
        return (
            <Tooltip title={<RichRenderer node={node.tooltip} environment={environment} />}>
                {result}
            </Tooltip>
        );
    }

    return result;
};

export default RichBullet;