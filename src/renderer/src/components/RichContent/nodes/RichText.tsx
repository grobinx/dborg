import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { styled, SxProps } from "@mui/material/styles";
import { IRichContainerDefaults, IRichText, RichTextVariant } from "../types";
import { getSeverityColor } from "..";
import Markdown from "react-markdown";
import Code from "@renderer/components/Code";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";

interface RichTextProps {
    node: Optional<IRichText, "type">;
    defaults?: IRichContainerDefaults;
}

interface VariantStyle {
    fontSize: string;
    lineHeight: number;
    fontWeight: number;
    letterSpacing?: string;
    textTransform?: "uppercase";
    component: React.ElementType;
}

export const RICH_TEXT_VARIANT_STYLES: Record<Exclude<RichTextVariant, "markdown">, VariantStyle> = {
    micro: { fontSize: "0.79em", lineHeight: 1.30, fontWeight: 400, component: "span" },
    caption: { fontSize: "0.89em", lineHeight: 1.35, fontWeight: 400, component: "span" },
    description: { fontSize: "0.95em", lineHeight: 1.45, fontWeight: 400, component: "p" },
    body: { fontSize: "1em", lineHeight: 1.50, fontWeight: 400, component: "p" },
    "body-strong": { fontSize: "1em", lineHeight: 1.50, fontWeight: 600, component: "p" },
    lead: { fontSize: "1.12em", lineHeight: 1.45, fontWeight: 400, component: "p" },
    label: { fontSize: "0.89em", lineHeight: 1.30, fontWeight: 600, letterSpacing: "0.01em", component: "span" },
    overline: { fontSize: "0.79em", lineHeight: 1.25, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", component: "span" },
    "title-sm": { fontSize: "1.26em", lineHeight: 1.30, fontWeight: 600, component: "h4" },
    title: { fontSize: "1.42em", lineHeight: 1.25, fontWeight: 600, component: "h3" },
    "title-lg": { fontSize: "1.60em", lineHeight: 1.20, fontWeight: 700, component: "h2" },
    display: { fontSize: "1.80em", lineHeight: 1.15, fontWeight: 700, component: "h1" },
    "code-inline": { fontSize: "0.92em", lineHeight: 1.40, fontWeight: 400, component: "code" },
};

const DEFAULT_VARIANT_STYLE = RICH_TEXT_VARIANT_STYLES.body;

const StyledRichTextRoot = styled(Box, {
    name: 'RichText',
    slot: "root",
    shouldForwardProp: (prop) => prop !== "ownerStyle",
})<{ ownerStyle: VariantStyle }>(({ ownerStyle }) => ({
    fontSize: ownerStyle.fontSize,
    lineHeight: ownerStyle.lineHeight,
    fontWeight: ownerStyle.fontWeight,
    letterSpacing: ownerStyle.letterSpacing,
    textTransform: ownerStyle.textTransform,
    fontFamily: "inherit",
    margin: 0,
}));

const RichTextRoot: React.FC<{ 
    component?: React.ElementType;
    variant: RichTextVariant; 
    children?: React.ReactNode; 
    className?: string; 
    sx?: SxProps 
}> = ({ component, variant, children, className, sx }) => {
    const style = (variant ? RICH_TEXT_VARIANT_STYLES[variant] : undefined) ?? DEFAULT_VARIANT_STYLE;

    return (
        <StyledRichTextRoot
            as={component ?? style.component}
            ownerStyle={style}
            className={clsx(
                "RichText-root",
                "RichNode-text",
                `variant-${variant}`,
                className
            )}
            sx={sx}
        >
            {children}
        </StyledRichTextRoot>
    );
};

const RichText: React.FC<RichTextProps> = ({ node, defaults }) => {
    const theme = useTheme();

    if (node.variant === "markdown") {
        return (
            <Box className="RichNode-markdown" sx={{ color: getSeverityColor(node.severity, theme) }}>
                <Markdown
                    components={React.useMemo(() => ({
                        p: (props) => <RichTextRoot variant="body" component="span" {...props} />,
                        h1: (props) => <RichTextRoot variant="display" component="h1" {...props} />,
                        h2: (props) => <RichTextRoot variant="title-lg" component="h2" {...props} />,
                        h3: (props) => <RichTextRoot variant="title" component="h3" {...props} />,
                        h4: (props) => <RichTextRoot variant="title-sm" component="h4" {...props} />,
                        h5: (props) => <RichTextRoot variant="lead" component="p" {...props} />,
                        h6: (props) => <RichTextRoot variant="body-strong" component="p" {...props} />,
                        code: Code,
                    }), [theme, defaults])}
                >
                    {`${node.text}`}
                </Markdown>
            </Box>
        );
    }

    const style = (node.variant ? RICH_TEXT_VARIANT_STYLES[node.variant] : undefined) ?? DEFAULT_VARIANT_STYLE;

    return (
        <RichTextRoot
            variant={node.variant ?? "body"}
            sx={{ color: getSeverityColor(node.severity, theme) }}
        >
            {node.text}
        </RichTextRoot>
    );
};

export default RichText;
