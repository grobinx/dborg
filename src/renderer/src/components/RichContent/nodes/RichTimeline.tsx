import React from "react";
import { Box, useTheme } from "@mui/material";
import { IRichEnvironment, IRichTimeline, IRichTimelineItem } from "../types";
import RichRenderer, { getSeverityColor, RichIcon, RichProp } from "..";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import Tooltip from "@renderer/components/Tooltip";

interface RichTimelineProps extends RichProp {
    node: Optional<IRichTimeline, "type">;
    environment?: IRichEnvironment;
}

const getItemColor = (item: IRichTimelineItem, theme: any) => {
    const color = getSeverityColor(item.severity, theme);
    return color === "inherit" ? theme.palette.text.secondary : color;
};

const RichTimeline: React.FC<RichTimelineProps> = ({ node, environment }) => {
    const theme = useTheme();
    const gap = environment?.theme?.gap ?? 4;
    const lastIndex = node.items.length - 1;

    if (node.excluded) {
        return null;
    }

    const columnTemplate = node.items.some(item => item.timestamp) ? `${Math.max(...node.items.map(item => (typeof item.timestamp === "string" ? item.timestamp.length : 12) * 0.5))}em 1.5em minmax(0, 1fr)` : "1.5em minmax(0, 1fr)";

    const result = (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-timeline", node.className)}
            style={node.style}
            sx={{
                display: "flex",
                flexDirection: "column",
                gap,
                width: "100%",
            }}
        >
            {node.items.map((item, index) => {
                const markerColor = getItemColor(item, theme);

                return (
                    <Box
                        key={index}
                        className="RichNode-timeline-item"
                        sx={{
                            display: "grid",
                            gridTemplateColumns: columnTemplate,
                            columnGap: gap,
                            rowGap: gap,
                            alignItems: "start",
                            gap: gap,
                        }}
                    >
                        {/* Rząd 1: timestamp | marker | label */}
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", color: theme.palette.text.secondary, height: "100%" }}>
                            {item.timestamp && <RichRenderer node={item.timestamp} environment={environment} textVariant="caption" />}
                        </Box>

                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                            }}
                        >
                            {item.icon ? (
                                <RichIcon node={{ icon: item.icon, severity: item.severity }} environment={environment} />
                            ) : (
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        backgroundColor: markerColor,
                                    }}
                                />
                            )}
                        </Box>

                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <RichRenderer node={item.label} environment={environment} textVariant="label" />
                        </Box>

                        {/* Rząd 2: pusto | pionowa kreska | caption */}
                        {item.description && (
                            <>
                                <Box />
                                <Box sx={{ display: "flex", justifyContent: "center", height: "100%", }}>
                                    {index < lastIndex && (
                                        <Box
                                            sx={{
                                                width: 2,
                                                borderRadius: 1,
                                                backgroundColor: theme.palette.divider,
                                            }}
                                        />
                                    )}
                                </Box>

                                <Box sx={{ minWidth: 0 }}>
                                    <RichRenderer node={item.description} environment={environment} textVariant="description" />
                                </Box>
                            </>
                        )}
                    </Box>
                );
            })}
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

export default RichTimeline;