import React from "react";
import { Chip, Box, useTheme } from "@mui/material";
import { IRichChip, IRichContainerDefaults, RichNode } from "../types";
import RichBadge from "./RichBadge";
import RichRenderer, { resolveRichValue, resolveRichValueFromFunction, RichIcon } from "..";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import Tooltip from "@renderer/components/Tooltip";

interface RichChipProps {
    node: Optional<IRichChip, "type">;
    defaults?: IRichContainerDefaults;
}

const RichChip: React.FC<RichChipProps> = ({ node, defaults }) => {
    const theme = useTheme();
    const [text, setText] = React.useState<RichNode | null>(resolveRichValue(node.text));

    React.useEffect(() => {
        resolveRichValueFromFunction<RichNode>(node.text, setText);
    }, [node.text]);

    if (node.excluded) {
        return null;
    }

    const result = (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-chip", node.className)}
            style={node.style}
            sx={{ display: "inline-block", position: "relative", alignSelf: "flex-start", }}
        >
            {text ? (
                <Chip
                    label={<RichRenderer node={text} defaults={defaults} textVariant="label" />}
                    size="small"
                    sx={{
                        paddingRight: node.badge ? (defaults?.padding ?? 8) : undefined,
                        fontSize: "inherit",
                        fontFamily: "inherit",
                        lineHeight: "inherit",
                        height: "auto",
                    }}
                    variant={node.variant}
                    color={node.severity}
                />
            ) : (
                <Box sx={{ height: "1.5em" }}>
                    <RichIcon node={{ icon: "Loading" }} defaults={defaults} />
                </Box>
            )}
            {node.badge && (
                <Box
                    sx={{
                        position: "absolute",
                        top: "-8px",
                        right: "-8px",
                    }}
                >
                    <RichBadge node={node.badge} defaults={defaults} />
                </Box>
            )}
        </Box>
    );

    if (node.tooltip) {
        return (
            <Tooltip title={<RichRenderer node={node.tooltip} defaults={defaults} />}>
                {result}
            </Tooltip>
        );
    }

    return result;
};

export default RichChip;
