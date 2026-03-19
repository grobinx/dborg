import React from "react";
import { Box, useTheme } from "@mui/material";
import { IRichWidget, IRichEnvironment, IRichWidgetRenderer } from "../types";
import RichRenderer, { RichColumn, RichIcon, RichProp } from "..";
import Tooltip from "@renderer/components/Tooltip";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import { useTranslation } from "react-i18next";

interface RichWidgetProps extends RichProp {
    node: Optional<IRichWidget, "type">;
    environment?: IRichEnvironment;
}

const findRenderer = (env?: IRichEnvironment, widgetId?: string): IRichWidgetRenderer | undefined => {
    if (!widgetId || !env) return undefined;

    if (!env.widgets) return undefined;

    return env.widgets.get(widgetId);
};

const RichWidget: React.FC<RichWidgetProps> = ({ node, environment }) => {
    const theme = useTheme();
    const { t } = useTranslation();

    if (node.excluded) return null;

    const renderer = findRenderer(environment, node.widgetId);

    try {
        const rendered = renderer
            ? renderer.render(node.props ?? {}, node)
            : node.fallback
                ? <RichRenderer node={node.fallback} environment={environment} />
                : <Box sx={{ color: theme.palette.text.secondary, fontStyle: "italic" }}>{t("unknown-rich-widget", "Unknown Rich Widget {{widgetId}}", { widgetId: node.widgetId })}</Box>;

        const result = (
            <Box
                id={node.id}
                hidden={node.hidden}
                key={node.key ?? node.id}
                className={clsx("RichNode-widget", node.className)}
                style={node.style}
                sx={{
                    fontFamily: environment?.theme?.fontFamily ?? "inherit",
                    fontSize: environment?.theme?.fontSize ?? "inherit",
                }}
            >
                {rendered}
            </Box>
        );

        if (node.tooltip) {
            return <Tooltip title={<RichRenderer node={node.tooltip} environment={environment} />}>{result}</Tooltip>;
        }

        return result;
    } catch (error) {
        console.error("Error rendering RichWidget:", error);
        return (
            <RichIcon
                node={{
                    icon: "Error",
                    severity: "error",
                    tooltip: {
                        type: "column",
                        items: [
                            {
                                type: "text",
                                text: t("rich-widget-render-error", "Error rendering widget \"{{widgetId}}\"", { widgetId: node.widgetId }),
                            },
                            {
                                type: "text",
                                text: error instanceof Error ? error.message : String(error),
                                decoration: ["monospace"],
                            }
                        ]
                    }
                }
                }
                environment={environment}
            />
        );
    }
};

export default RichWidget;