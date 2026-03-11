import React from "react";
import { Box } from "@mui/material";
import { IRichContainer, IRichContainerDefaults } from "../types";
import RichRenderer from "..";
import { useSetting } from "@renderer/contexts/SettingsContext";

interface RichContainerProps {
    node: IRichContainer;
}

const RichContainer: React.FC<RichContainerProps> = ({ node }) => {
    const [fontSize] = useSetting("ui", "fontSize");
    const [fontFamily] = useSetting("ui", "fontFamily");
    const [fontFamilyMonospace] = useSetting("ui", "fontFamilyMonospace");

    const defaults = React.useMemo(() => {
        return {
            fontSize: node.fontSize ?? fontSize,
            fontFamily: node.fontFamily ?? fontFamily,
            fontFamilyMonospace: node.fontFamilyMonospace ?? fontFamilyMonospace,
            padding: node.padding ?? "4px 8px",
            gap: node.gap ?? 4,
            fontWeight: node.fontWeight ?? "normal",
            radius: node.radius ?? 3,
        } as IRichContainerDefaults;
    }, [fontSize, fontFamily, fontFamilyMonospace]);

    return (
        <Box
            className="RichContainer-container"
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
            {node.items.map((item, index) => (
                <RichRenderer key={index} node={item} defaults={defaults} />
            ))}
        </Box>
    );
};

export default RichContainer;