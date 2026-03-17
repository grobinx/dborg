import React from "react";
import { Box } from "@mui/material";
import { IRichContainer, IRichContainerTheme, IRichEnvironment, RichNode } from "../types";
import RichRenderer, { resolveRichValue, resolveRichValueFromFunction, RichIcon } from "..";
import { useSetting } from "@renderer/contexts/SettingsContext";
import clsx from "@renderer/utils/clsx";

interface RichContainerProps {
    node: IRichContainer;
    children?: React.ReactNode;
}

const RichContainer: React.FC<RichContainerProps> = ({ node, children }) => {
    const [fontSize] = useSetting("ui", "fontSize");
    const [fontFamily] = useSetting("ui", "fontFamily");
    const [fontFamilyMonospace] = useSetting("ui", "fontFamilyMonospace");
    const [items, setItems] = React.useState<RichNode[] | null>(resolveRichValue(node.items));

    const theme = React.useMemo(() => {
        return {
            fontSize: node.fontSize ?? fontSize,
            fontFamily: node.fontFamily ?? fontFamily,
            fontFamilyMonospace: node.fontFamilyMonospace ?? fontFamilyMonospace,
            padding: node.padding ?? "4px 8px",
            gap: node.gap ?? 4,
            fontWeight: node.fontWeight ?? "normal",
            radius: node.radius ?? "3px",
            textVariantStyles: node.textVariantStyles,
        } as IRichContainerTheme;
    }, [fontSize, fontFamily, fontFamilyMonospace, node.fontFamily, node.fontFamilyMonospace, node.fontSize, node.fontWeight, node.gap, node.padding, node.radius, node.textVariantStyles]);

    const environment: IRichEnvironment = React.useMemo(() => {
        return {
            theme: theme,
            widgets: node.widgets ? new Map(node.widgets.map(widget => [widget.widgetId, widget])) : undefined,
        };
    }, [node?.widgets, theme]);

    React.useEffect(() => {
        resolveRichValueFromFunction(node.items, setItems);
    }, [node.items]);

    return (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichContainer-root", node.className)}
            style={node.style}
            sx={{
                display: "flex",
                flexDirection: "column",
                width: node.width ?? "100%",
                height: node.height ?? "100%",
                overflow: node.overflow ?? "auto",
                flex: 1,
                p: theme.padding,
                fontFamily: theme.fontFamily,
                fontSize: theme.fontSize,
                fontWeight: theme.fontWeight,
                minHeight: 0,
                minWidth: 0,
            }}
        >
            <Box
                sx={{
                    width: "100%",
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: theme.gap,
                }}
            >
                {items === null ?
                    <RichIcon node={{ icon: "Loading" }} environment={environment} />
                    : items.map((item, index) => (
                        <RichRenderer key={index} node={item} environment={environment} />
                    ))
                }
                {children}
            </Box>
        </Box>
    );
};

export default RichContainer;
