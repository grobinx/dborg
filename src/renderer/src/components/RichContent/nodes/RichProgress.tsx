import React from "react";
import { LinearProgress, Box, useTheme } from "@mui/material";
import { IRichEnvironment, IRichProgress, RichSeverity } from "../types";
import clsx from "@renderer/utils/clsx";
import RichRenderer, { resolveRichValue, resolveRichValueFromFunction, RichProp, RichText } from "..";
import Tooltip from "@renderer/components/Tooltip";
import { resolve } from "path";

interface RichProgressProps extends RichProp {
    node: IRichProgress;
    environment?: IRichEnvironment;
}

const RichProgress: React.FC<RichProgressProps> = ({ node, environment, refreshId }) => {
    const theme = useTheme();
    const [value, setValue] = React.useState<number | null>(resolveRichValue(node.value));
    const [bufferValue, setBufferValue] = React.useState<number | null | undefined>(node.bufferValue !== undefined ? resolveRichValue(node.bufferValue) : undefined);

    React.useEffect(() => {
        resolveRichValueFromFunction<number>(node.value, setValue, node);
        if (node.bufferValue !== undefined) {
            resolveRichValueFromFunction<number | undefined>(node.bufferValue, setBufferValue, node);
        }
    }, [node.value, node.bufferValue, refreshId]);

    const getColorFromSeverity = (severity?: RichSeverity) => {
        switch (severity) {
            case "error":
                return "error";
            case "warning":
                return "warning";
            case "success":
                return "success";
            case "info":
                return "info";
            default:
                return "primary";
        }
    };

    if (node.excluded) {
        return null;
    }

    const result = (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            style={node.style}
            className={clsx("RichNode-progress", node.className)}
        >
            {(node.label || node.showPercent) && (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {node.label && <RichRenderer node={node.label} environment={environment} textVariant="caption" />}
                    {node.showPercent && <RichText node={{ text: value !== null ? `${Math.round(value ?? 0)}%` : "-", variant: "caption" }} environment={environment} />}
                </Box>
            )}
            <LinearProgress
                variant={node.bufferValue !== undefined ? "buffer" : "determinate"}
                value={value ?? 0}
                valueBuffer={bufferValue ?? undefined}
                color={getColorFromSeverity(node.severity)}
                sx={{ height: "6px", borderRadius: environment?.theme?.radius ?? 4 }}
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

export default RichProgress;
