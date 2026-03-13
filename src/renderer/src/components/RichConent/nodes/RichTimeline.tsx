import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichTimeline, IRichTimelineItem } from "../types";
import RichRenderer, { getSeverityColor, RichIcon, RichText } from "..";
import { resolveIcon } from "@renderer/themes/icons";
import { Optional } from "@renderer/types/universal";

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
    const gap = defaults?.gap ?? 8;
    const lastIndex = node.items.length - 1;

    const columnTemplate = node.items.some(item => item.timestamp) ? `${Math.max(...node.items.map(item => (item.timestamp?.length ?? 0) * 0.5))}em 1.5em minmax(0, 1fr)` : "1.5em minmax(0, 1fr)";

    return (
        <Box
            className="RichNode-timeline"
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
                        }}
                    >
                        {/* Rząd 1: timestamp | marker | label */}
                        <Box sx={{ textAlign: "right", color: theme.palette.text.secondary, height: "100%" }}>
                            {item.timestamp && <RichText node={{ text: item.timestamp, variant: "caption" }} defaults={defaults} />}
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
                            <RichText node={{ text: item.label, variant: "label" }} defaults={defaults} />
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

                                <Box sx={{ minWidth: 0, pb: index < lastIndex ? gap : 0 }}>
                                    <RichRenderer node={item.description} defaults={defaults} />
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