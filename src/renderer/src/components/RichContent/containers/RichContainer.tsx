import React from "react";
import { Box } from "@mui/material";
import { IRichContainer, IRichContainerDefaults, RichNode } from "../types";
import RichRenderer, { resolveRichValue, resolveRichValueFromFunction, RichIcon } from "..";
import { useSetting } from "@renderer/contexts/SettingsContext";
import clsx from "@renderer/utils/clsx";

interface RichContainerProps {
    node: IRichContainer;
}

const RichContainer: React.FC<RichContainerProps> = ({ node }) => {
    const [fontSize] = useSetting("ui", "fontSize");
    const [fontFamily] = useSetting("ui", "fontFamily");
    const [fontFamilyMonospace] = useSetting("ui", "fontFamilyMonospace");
    const [items, setItems] = React.useState<RichNode[] | null>(resolveRichValue(node.items));

    const defaults = React.useMemo(() => {
        return {
            fontSize: node.fontSize ?? fontSize,
            fontFamily: node.fontFamily ?? fontFamily,
            fontFamilyMonospace: node.fontFamilyMonospace ?? fontFamilyMonospace,
            padding: node.padding ?? "4px 8px",
            gap: node.gap ?? 4,
            fontWeight: node.fontWeight ?? "normal",
            radius: node.radius ?? 3,
            textVariantStyles: node.textVariantStyles,
        } as IRichContainerDefaults;
    }, [fontSize, fontFamily, fontFamilyMonospace, node.fontFamily, node.fontFamilyMonospace, node.fontSize, node.fontWeight, node.gap, node.padding, node.radius, node.textVariantStyles]);

    React.useEffect(() => {
        resolveRichValueFromFunction(node.items, setItems);
    }, [node.items]);

    return (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichContainer-container", node.className)}
            style={node.style}
            sx={{
                width: node.width ?? "100%",
                height: node.height,
                overflow: node.overflow,
                display: "flex",
                flexDirection: "column",
                p: defaults.padding,
                gap: defaults.gap,
                fontFamily: defaults.fontFamily,
                fontSize: defaults.fontSize,
                fontWeight: defaults.fontWeight,
            }}
        >
            {items === null ?
                <RichIcon node={{ icon: "Loading" }} defaults={defaults} />
                : items.map((item, index) => (
                    <RichRenderer key={index} node={item} defaults={defaults} />
                ))
            }
        </Box>
    );
};

export default RichContainer;