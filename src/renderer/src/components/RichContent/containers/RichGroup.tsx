import React from "react";
import { Box, useTheme } from "@mui/material";
import { IRichEnvironment, IRichGroup, RichNode } from "../types";
import RichRenderer, { resolveRichValue, resolveRichValueFromFunction, RichIcon } from "..";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import Tooltip from "@renderer/components/Tooltip";

interface RichGroupProps {
    node: Optional<IRichGroup, "type">;
    environment?: IRichEnvironment;
    children?: React.ReactNode;
}

const RichGroup: React.FC<RichGroupProps> = ({ node, environment, children }) => {
    const theme = useTheme();
    const [items, setItems] = React.useState<RichNode[] | null>(resolveRichValue(node.items));

    React.useEffect(() => {
        resolveRichValueFromFunction(node.items, setItems);
    }, [node.items]);

    if (node.excluded) {
        return null;
    }

    const result = (
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
                <RichIcon node={{ icon: "Loading" }} environment={environment} />
                : items.map((item, index) => (
                    <RichRenderer key={index} node={item} environment={environment} />
                ))
            }
            {children}
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

export default RichGroup;
