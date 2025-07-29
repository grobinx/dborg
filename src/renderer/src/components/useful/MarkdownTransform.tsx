import { Stack, styled, Theme, Typography, useTheme } from "@mui/material";
import { resolveIcon } from "@renderer/themes/icons";
import { resolveColor } from "@renderer/themes/utils";
import React, { isValidElement, ReactNode } from "react";
import Code from "../Code";
import ReactMarkdown from "react-markdown";

let counter: bigint = 0n;

export type MarkdownString =
    string
    | (string                           // left aligned string
        | [string, string]              // left and right aligned string
        | [string, string, string])[];  // left, center and right aligned string

const StyledMarkdownParagraph = styled('span', {
    name: "Markdown", // The component name
    slot: "paragraph", // The slot name
})(() => ({
    whiteSpace: "pre-wrap", 
    display: "flex", 
    alignItems: "center",
}));

const MarkdownParagraph: React.FC<React.ComponentProps<typeof StyledMarkdownParagraph>> = (props) => {
    return (
        <StyledMarkdownParagraph
            className="Markdown-paragraph"
            {...props}
        >
            {props.children}
        </StyledMarkdownParagraph>
    );
}

export const Markdown: React.FC<React.ComponentProps<typeof ReactMarkdown>> = (props) => {
    const theme = useTheme();

    return (
        <ReactMarkdown
            {...props}
            components={{
                p: MarkdownParagraph,
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
    );
}

export const markdown = (text: MarkdownString, theme: Theme): ReactNode => {
    if (typeof text === 'string') {
        // Obsługa przypadku, gdy `text` jest zwykłym ciągiem znaków
        return <Markdown key={counter++}>{text}</Markdown>;
    } else if (Array.isArray(text)) {
        // Obsługa przypadku, gdy `text` jest tablicą
        return (
            <Stack
                key={counter++}
                direction="column"
                divider={<hr style={{ width: "100%", border: "none", borderTop: "1px solid", borderColor: theme.palette.divider, margin: 0 }} />}
                gap={1}
                sx={{ whiteSpace: "pre-wrap" }}
            >
                {text.map((item) => {
                    if (typeof item === 'string') {
                        // Obsługa pojedynczego ciągu znaków w tablicy
                        return <Markdown key={counter++}>{item}</Markdown>;
                    } else if (Array.isArray(item)) {
                        if (item.length === 2) {
                            // Obsługa tablicy dwóch ciągów znaków (left, right aligned)
                            return (
                                <Stack
                                    key={counter++}
                                    direction="row"
                                    gap={8}
                                    justifyContent="space-between"
                                >
                                    <span key={counter++} style={{ textAlign: "left" }}><Markdown>{item[0]}</Markdown></span>
                                    <span key={counter++} style={{ textAlign: "right" }}><Markdown>{item[1]}</Markdown></span>
                                </Stack>
                            );
                        } else if (item.length === 3) {
                            // Obsługa tablicy trzech ciągów znaków (left, center, right aligned)
                            return (
                                <Stack
                                    key={counter++}
                                    direction="row"
                                    gap={8}
                                    justifyContent="space-between"
                                >
                                    <span key={counter++} style={{ textAlign: "left" }}><Markdown>{item[0]}</Markdown></span>
                                    <span key={counter++} style={{ textAlign: "center" }}><Markdown>{item[1]}</Markdown></span>
                                    <span key={counter++} style={{ textAlign: "right" }}><Markdown>{item[2]}</Markdown></span>
                                </Stack>
                            );
                        }
                    }
                    return null;
                })}
            </Stack>
        );
    }

    return null;
};

export function escape(text: string): string {
    return text.replace(/([*_`[\]()#+\-!])/g, '\\$1');
}
