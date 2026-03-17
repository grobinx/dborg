import React from "react";
import { Box, useTheme } from "@mui/material";
import { styled, SxProps } from "@mui/material/styles";
import { IRichEnvironment, IRichText, RichTextVariant, RichTextVariantStyle, RichTextVariantStyles } from "../types";
import RichRenderer, { getSeverityColor, RichCode } from "..";
import Markdown, { Components } from "react-markdown";
import Code from "@renderer/components/Code";
import { Optional } from "@renderer/types/universal";
import clsx from "@renderer/utils/clsx";
import Tooltip from "@renderer/components/Tooltip";

interface RichTextProps {
    node: Optional<IRichText, "type">;
    environment?: IRichEnvironment;
}

export const RICH_TEXT_VARIANT_STYLES: RichTextVariantStyles = {
    micro: { fontSize: "0.79em", lineHeight: 1.30, fontWeight: 400, component: "span" },
    caption: { fontSize: "0.89em", lineHeight: 1.35, fontWeight: 400, component: "span" },
    description: { fontSize: "0.95em", lineHeight: 1.45, fontWeight: 400, component: "p" },
    body: { fontSize: "1em", lineHeight: 1.50, fontWeight: 400, component: "p" },
    lead: { fontSize: "1.12em", lineHeight: 1.45, fontWeight: 400, component: "p" },
    label: { fontSize: "0.89em", lineHeight: 1.30, fontWeight: 600, letterSpacing: "0.01em", component: "span" },
    overline: { fontSize: "0.79em", lineHeight: 1.25, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", component: "span" },
    "title-sm": { fontSize: "1.26em", lineHeight: 1.30, fontWeight: 600, component: "h4" },
    title: { fontSize: "1.42em", lineHeight: 1.25, fontWeight: 600, component: "h3" },
    "title-lg": { fontSize: "1.60em", lineHeight: 1.20, fontWeight: 600, component: "h2" },
    hero: { fontSize: "1.80em", lineHeight: 1.15, fontWeight: 600, component: "h1" },
    "code": { fontSize: "0.92em", lineHeight: 1.40, fontWeight: 400, component: "code" },
};

const DEFAULT_VARIANT_STYLE = RICH_TEXT_VARIANT_STYLES.body;

const StyledRichTextRoot = styled(Box, {
    name: 'RichText',
    slot: "root",
    shouldForwardProp: (prop) => prop !== "ownerStyle",
})<{ ownerStyle: RichTextVariantStyle }>(({ ownerStyle }) => ({
    fontSize: ownerStyle.fontSize,
    lineHeight: ownerStyle.lineHeight,
    fontWeight: ownerStyle.fontWeight,
    letterSpacing: ownerStyle.letterSpacing,
    textTransform: ownerStyle.textTransform,
    fontFamily: "inherit",
    margin: 0,
    whiteSpace: "pre-wrap",
}));

const RichTextRoot: React.FC<{
    id?: string;
    hidden?: boolean;
    style?: React.CSSProperties;
    component?: React.ElementType;
    variant: RichTextVariant;
    children?: React.ReactNode;
    className?: string;
    sx?: SxProps;
    textVariantStyles?: Partial<RichTextVariantStyles>;
    environment?: IRichEnvironment;
}> = ({ id, hidden, style, component, variant, children, className, sx, textVariantStyles: variantStyles, environment, ...other }) => {
    const ownerStyle = (variant ? (variantStyles?.[variant] ?? RICH_TEXT_VARIANT_STYLES[variant]) : undefined) ?? DEFAULT_VARIANT_STYLE;

    return (
        <StyledRichTextRoot
            id={id}
            hidden={hidden}
            style={style}
            as={component ?? ownerStyle.component}
            ownerStyle={ownerStyle}
            className={clsx(
                "RichText-root",
                "RichNode-text",
                `variant-${variant}`,
                className
            )}
            sx={sx}
            {...other}
        >
            {children}
        </StyledRichTextRoot>
    );
};

const RichText: React.FC<RichTextProps> = ({ node, environment }) => {
    const theme = useTheme();

    if (node.variant === "markdown") {
        const components: Components = React.useMemo(() => ({
            p: (props) => <RichTextRoot variant="body" component="span" textVariantStyles={environment?.theme?.textVariantStyles} {...props} />,
            h1: (props) => <RichTextRoot variant="hero" component="h1" textVariantStyles={environment?.theme?.textVariantStyles} {...props} />,
            h2: (props) => <RichTextRoot variant="title-lg" component="h2" textVariantStyles={environment?.theme?.textVariantStyles} {...props} />,
            h3: (props) => <RichTextRoot variant="title" component="h3" textVariantStyles={environment?.theme?.textVariantStyles} {...props} />,
            h4: (props) => <RichTextRoot variant="title-sm" component="h4" textVariantStyles={environment?.theme?.textVariantStyles} {...props} />,
            h5: (props) => <RichTextRoot variant="lead" component="p" textVariantStyles={environment?.theme?.textVariantStyles} {...props} />,
            code: ({ className, children }) => {
                const language = className?.match(/language-(\w+)/)?.[1];
                const isInline = !className && !String(children).includes('\n');

                if (!isInline && language) {
                    return <RichCode node={{ code: String(children).trim(), language }} environment={environment} />;
                } else if (!isInline) {
                    return <RichCode node={{ code: String(children).trim() }} environment={environment} />;
                } else {
                    return <Code>{String(children).trim()}</Code>
                }
            },
        }), [theme, environment, environment?.theme?.textVariantStyles]);

        if (node.excluded) {
            return null;
        }

        return (
            <Box
                id={node.id}
                hidden={node.hidden}
                key={node.key ?? node.id}
                className={clsx("RichNode-text", "RichNode-markdown", node.className)}
                style={node.style}
                sx={{ color: getSeverityColor(node.severity, theme) }}
            >
                <Markdown
                    components={components}
                >
                    {`${node.text}`}
                </Markdown>
            </Box>
        );
    }

    if (node.excluded) {
        return null;
    }

    const result = (
        <RichTextRoot
            id={node.id}
            hidden={node.hidden}
            key={node.key ?? node.id}
            className={clsx("RichNode-text", node.className)}
            style={node.style}
            variant={node.variant ?? "body"}
            sx={{
                color: getSeverityColor(node.severity, theme),
                fontFamily: node.decoration?.includes("monospace") || node.variant === "code" ? environment?.theme?.fontFamilyMonospace ?? theme.typography.monospaceFontFamily : undefined,
                fontWeight: node.decoration?.includes("bold") ? "bold" : undefined,
                fontStyle: node.decoration?.includes("italic") ? "italic" : undefined,
                textDecoration: [
                    node.decoration?.includes("underline") ? "underline" : undefined,
                    node.decoration?.includes("strikethrough") ? "line-through" : undefined,
                    node.decoration?.includes("uppercase") ? "uppercase" : undefined,
                ].filter(Boolean).join(" "),
            }}
            textVariantStyles={environment?.theme?.textVariantStyles}
        >
            {node.text}
        </RichTextRoot>
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

export default RichText;
