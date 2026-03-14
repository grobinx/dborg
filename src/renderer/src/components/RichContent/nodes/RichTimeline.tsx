import React from "react";
import { Box, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichTimeline, IRichTimelineItem } from "../types";
import RichRenderer, { getSeverityColor, RichIcon } from "..";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";

interface RichTimelineProps {
    node: Optional<IRichTimeline, "type">;
    defaults?: IRichContainerDefaults;
}

const getItemColor = (item: IRichTimelineItem, theme: any) => {
    const color = getSeverityColor(item.severity, theme);
    return color === "inherit" ? theme.palette.text.secondary : color;
};

const RichTimeline: React.FC<RichTimelineProps> = ({ node, defaults }) => {
    const theme = useTheme();
    const gap = defaults?.gap ?? 4;
    const lastIndex = node.items.length - 1;

    const columnTemplate = node.items.some(item => item.timestamp) ? `${Math.max(...node.items.map(item => (typeof item.timestamp === "string" ? item.timestamp.length : 12) * 0.5))}em 1.5em minmax(0, 1fr)` : "1.5em minmax(0, 1fr)";

    return (
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
                            {item.timestamp && <RichRenderer node={item.timestamp} defaults={defaults} textVariant="caption" />}
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
                                <RichIcon node={{ icon: item.icon, severity: item.severity }} defaults={defaults} />
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
                            <RichRenderer node={item.label} defaults={defaults} textVariant="label" />
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
                                    <RichRenderer node={item.description} defaults={defaults} textVariant="description" />
                                </Box>
                            </>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
};

export default RichTimeline;