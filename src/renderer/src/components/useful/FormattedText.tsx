import { Stack, styled, SxProps, Theme, Typography, useTheme } from "@mui/material";
import { resolveIcon } from "@renderer/themes/icons";
import React, { isValidElement, ReactNode } from "react";
import Code from "../Code";
import ReactMarkdown from "react-markdown";

export type FormattedContentItem = React.ReactNode | string;
export type FormattedContent =
    FormattedContentItem // pojedynczy element
    | (FormattedContentItem  // lista z pozycjami wyrównanymi do lewej
        | [FormattedContentItem, FormattedContentItem]    // lista z pozycjami wyrównanymi do lewej i prawej
        | [FormattedContentItem, FormattedContentItem, FormattedContentItem]   // lista z pozycjami wyrównanymi do lewej, środka i prawej
    )[];

const StyledFormattedTextParagraph = styled('span', {
    name: "FormattedText", // The component name
    slot: "root", // The slot name
})(() => ({
    whiteSpace: "pre-wrap",
    display: "flex",
    alignItems: "center",
}));

export interface FormattedTextParagraphProps extends React.HTMLAttributes<HTMLSpanElement> {
    children?: ReactNode;
}

const FormattedTextParagraph: React.FC<FormattedTextParagraphProps> = (props) => {
    return (
        <StyledFormattedTextParagraph
            className="FormattedText-root"
            {...props}
        >
            {props.children}
        </StyledFormattedTextParagraph>
    );
}

interface FormattedTextElementProps extends React.ComponentProps<typeof ReactMarkdown> {
    style?: React.CSSProperties;
    sx?: SxProps<Theme>;
}

export const FormattedTextElement: React.FC<FormattedTextElementProps> = (props) => {
    const theme = useTheme();

    return (
        <FormattedTextParagraph>
            <ReactMarkdown
                {...props}
                components={{
                    p: (props) => <Typography fontSize="inherit" lineHeight="inherit" {...props} />,
                    h1: (props) => <Typography variant="h1" {...props} />,
                    h2: (props) => <Typography variant="h2" {...props} />,
                    h3: (props) => <Typography variant="h3" {...props} />,
                    h4: (props) => <Typography variant="h4" {...props} />,
                    h5: (props) => <Typography variant="h5" {...props} />,
                    h6: (props) => <Typography variant="h6" {...props} />,
                    code: Code,
                    img: ({ src, alt }) => resolveIcon(theme, src, alt),
                    ...props.components,
                }}
            />
        </FormattedTextParagraph>
    );
}

interface FormattedTextProps {
    text: FormattedContent;
    style?: React.CSSProperties;
    sx?: SxProps<Theme>;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ text, style, sx }) => {
    const theme = useTheme();

    if (typeof text === 'string') {
        // Obsługa przypadku, gdy `text` jest zwykłym ciągiem znaków
        return <FormattedTextElement style={style} sx={sx}>{text}</FormattedTextElement>;
    } else if (isValidElement(text)) {
        return text;
    } else if (Array.isArray(text)) {
        // Obsługa przypadku, gdy `text` jest tablicą
        return (
            <Stack
                direction="column"
                gap={1}
                sx={{ whiteSpace: "pre-wrap", alignItems: "flex-start" }}
                width={"100%"}
            >
                {text.map((item, index) => {
                    if (!Array.isArray(item)) {
                        if (typeof item === 'string') {
                            if (item.trim() === "-") {
                                return <hr key={`hr-${index}`} style={{ width: "100%", border: "none", borderTop: "1px solid", borderColor: theme.palette.divider, margin: 0 }} />;
                            }
                            return <FormattedTextElement key={`text-${index}`} style={style} sx={sx}>{item}</FormattedTextElement>;
                        }
                        if (isValidElement(item)) {
                            return React.cloneElement(item, { key: `element-${index}` });
                        }
                        return item;
                    } else if (Array.isArray(item)) {
                        return (
                            <Stack
                                key={`stack-${index}`}
                                direction="row"
                                gap={8}
                                justifyContent="space-between"
                                width={"100%"}
                                sx={{ alignItems: "center" }}
                            >
                                {item.map((subItem, index) => {
                                    if (typeof subItem === 'string') {
                                        return <FormattedTextElement key={index} style={style} sx={sx}>{subItem}</FormattedTextElement>;
                                    }
                                    if (isValidElement(subItem)) {
                                        return React.cloneElement(subItem, { key: `element-${index}` });
                                    }
                                    return subItem;
                                })}
                            </Stack>
                        );
                    }
                    return null;
                }).filter(Boolean)}
            </Stack>
        );
    }

    return null;
};
