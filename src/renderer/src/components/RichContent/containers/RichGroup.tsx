import React from "react";
import { Box, Paper, Collapse, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichGroup, IRichSection, RichNode } from "../types";
import RichRenderer, { getSeverityColor, resolveRichValue, resolveRichValueFromFunction, RichIcon, RichSpacer } from "..";
import { ToolButton } from "@renderer/components/buttons/ToolButton";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";

interface RichGroupnProps {
    node: Optional<IRichGroup, "type">;
    defaults?: IRichContainerDefaults;
    children?: React.ReactNode;
}

const RichGroup: React.FC<RichGroupnProps> = ({ node, defaults, children }) => {
    const theme = useTheme();
    const [items, setItems] = React.useState<RichNode[] | null>(resolveRichValue(node.items));

    React.useEffect(() => {
        resolveRichValueFromFunction(node.items, setItems);
    }, [node.items]);

    return (
        <Box
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichContainer-group", node.className)}
            style={node.style}
            sx={{
                display: "flex",
                flexDirection: node.direction === "horizontal" ? "row" : "column",
                overflow: "hidden",
                gap: node.gap,
            }}
        >
            {items === null ?
                <RichIcon node={{ icon: "Loading" }} defaults={defaults} />
                : items.map((item, index) => (
                    <RichRenderer key={index} node={item} defaults={defaults} />
                ))
            }
            {children}
        </Box>
    );
};

export default RichGroup;
