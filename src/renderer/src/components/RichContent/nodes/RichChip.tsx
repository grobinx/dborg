import React from "react";
import { Chip, Box, useTheme } from "@mui/material";
import { IRichChip, IRichEnvironment, RichNode } from "../types";
import RichBadge from "./RichBadge";
import RichRenderer, { resolveRichValue, resolveRichValueFromFunction, RichIcon } from "..";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import Tooltip from "@renderer/components/Tooltip";

interface RichChipProps {
    node: Optional<IRichChip, "type">;
    environment?: IRichEnvironment;
}

const RichChip: React.FC<RichChipProps> = ({ node, environment }) => {
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
                    label={<RichRenderer node={text} environment={environment} textVariant="label" />}
                    size="small"
                    sx={{
                        paddingRight: node.badge ? (environment?.theme?.padding ?? 8) : undefined,
                        fontSize: "inherit",
                        fontFamily: "inherit",
                        lineHeight: "inherit",
                        height: "auto",
                        display: "flex",
                        alignItems: "center",
                        "& .MuiChip-label": {
                            display: "flex",
                            alignItems: "center",
                            padding: environment?.theme ? `${environment.theme.padding} !important` : undefined,
                        },
                    }}
                    variant={node.variant}
                    color={node.severity}
                />
            ) : (
                <Box sx={{ height: "1.5em" }}>
                    <RichIcon node={{ icon: "Loading" }} environment={environment} />
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
                    <RichBadge node={node.badge} environment={environment} />
                </Box>
            )}
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

export default RichChip;
