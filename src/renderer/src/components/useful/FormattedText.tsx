import { Stack, styled, Theme, Typography, useTheme } from "@mui/material";
import { resolveIcon } from "@renderer/themes/icons";
import React, { isValidElement, ReactNode } from "react";
import Code from "../Code";
import ReactMarkdown from "react-markdown";

let counter: bigint = 0n;

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

export interface FormattedTextProps extends React.ComponentProps<typeof StyledFormattedTextParagraph> {
    children?: ReactNode;
}

const FormattedTextParagraph: React.FC<FormattedTextProps> = (props) => {
    return (
        <StyledFormattedTextParagraph
            className="FormattedText-root"
            {...props}
        >
            {props.children}
        </StyledFormattedTextParagraph>
    );
}

export const FormattedTextElement: React.FC<React.ComponentProps<typeof ReactMarkdown>> = (props) => {
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

export const FormattedText: React.FC<{ text: FormattedContent }> = ({ text }) => {
    const theme = useTheme();

    if (typeof text === 'string') {
        // Obsługa przypadku, gdy `text` jest zwykłym ciągiem znaków
        return <FormattedTextElement key={counter++}>{text}</FormattedTextElement>;
    } else if (isValidElement(text)) {
        return text;
    } else if (Array.isArray(text)) {
        // Obsługa przypadku, gdy `text` jest tablicą
        return (
            <Stack
                key={counter++}
                direction="column"
                divider={<hr style={{ width: "100%", border: "none", borderTop: "1px solid", borderColor: theme.palette.divider, margin: 0 }} />}
                gap={1}
                sx={{ whiteSpace: "pre-wrap" }}
                width={"100%"}
            >
                {text.map((item, index) => {
                    if (!Array.isArray(item)) {
                        if (typeof item === 'string') {
                            return <FormattedTextElement key={`text-${index}`}>{item}</FormattedTextElement>;
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
                            >
                                {item.map((subItem, index) => {
                                    if (typeof subItem === 'string') {
                                        return <FormattedTextElement key={index}>{subItem}</FormattedTextElement>;
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

export function escape(text: string): string {
    return text.replace(/([*_`[\]()#+\-!])/g, '\\$1');
}
