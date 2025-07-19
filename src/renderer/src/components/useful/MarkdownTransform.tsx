import { Error } from "@mui/icons-material";
import { Stack, Typography, useTheme } from "@mui/material";
import { resolveIcon } from "@renderer/themes/icons";
import { resolveColor } from "@renderer/themes/utils";
import { isTreeNode, transform, TransformationRule, TransformFunction } from "pattern-transformer";
import React, { isValidElement, ReactNode } from "react";

let counter: bigint = 0n;

export type MarkdownString =
    string
    | (string                           // left aligned string
        | [string, string]              // left and right aligned string
        | [string, string, string])[];  // left, center and right aligned string

const transformReactMatch: TransformFunction<ReactNode> = (match) => {
    return match.map(item => {
        if (item == null) return "";
        if (isTreeNode(item)) {
            return item.transformed;
        }
        if (isValidElement(item)) {
            return item;
        }
        if (Array.isArray(item)) {
            return item;
        }
        return <span key={counter++}>{item.toString()}</span>;
    });
}

function markdownRules(...additionalRules: TransformationRule<ReactNode>[]): TransformationRule<ReactNode>[] {
    const theme = useTheme();

    const baseRules: TransformationRule<ReactNode>[] = [
        {
            pattern: /#::(\w+)::(.*)::/, // Matches "#:red:some text:"
            group: 2,
            transform: (match, original) => {
                const color = original?.match(/#::(\w+)::/)?.[1];
                if (color) {
                    return <span key={counter++} style={{ color: resolveColor(color, theme)?.["light"] ?? color }}>{transformReactMatch(match)}</span>;
                }
                return null;
            },
        },
        {
            pattern: /!::(\w+)::/, // Matches "!:iconName:"
            group: 1,
            transform: (match) => <span key={counter++}>{resolveIcon(theme, match[0] as string)}</span>,
            stop: true,
        },
        {
            pattern: /^# (.*)$/m, // Matches lines starting with "# " (Markdown header level 1)
            group: 1,
            transform: (match) => <Typography key={counter++} variant="h1">{transformReactMatch(match)}</Typography>,
        },
        {
            pattern: /^## (.*)$/m, // Matches lines starting with "## " (Markdown header level 2)
            group: 1,
            transform: (match) => <Typography key={counter++} variant="h2">{transformReactMatch(match)}</Typography>,
        },
        {
            pattern: /^### (.*)$/m, // Matches lines starting with "### " (Markdown header level 3)
            group: 1,
            transform: (match) => <Typography key={counter++} variant="h3">{transformReactMatch(match)}</Typography>,
        },
        {
            pattern: /^#### (.*)$/m, // Matches lines starting with "#### " (Markdown header level 4)
            group: 1,
            transform: (match) => <Typography key={counter++} variant="h4">{transformReactMatch(match)}</Typography>,
        },
        {
            pattern: /\*\*(.*?)\*\*/, // Matches bold text enclosed in "**"
            group: 1,
            transform: (match) => <strong key={counter++}>{transformReactMatch(match)}</strong>,
        },
        {
            pattern: /\*(.*?)\*/, // Matches italic text enclosed in "*"
            group: 1,
            transform: (match) => <em key={counter++}>{transformReactMatch(match)}</em>,
        },
        {
            pattern: /\[(.*?)\]\((.*?)\)/, // Matches Markdown links [text](url)
            transform: (match) => {
                if (!match || match.length < 1 || typeof match[0] !== 'string') {
                    return null;
                }
                const found = match[0].match(/\[(.*?)\]\((.*?)\)/);
                if (!found || found.length < 3) {
                    return match[0];
                }
                return <a key={counter++} href={found[2]}>{found[1]}</a>;
            },
            stop: true,
        },
        {
            pattern: /!\[(.*?)\]\((.*?)\)/, // Matches Markdown images ![alt](url)
            transform: (match) => {
                if (!match || match.length < 1 || typeof match[0] !== 'string') {
                    return null;
                }
                const found = match[0].match(/!\[(.*?)\]\((.*?)\)/);
                if (!found || found.length < 3) {
                    return match[0];
                }
                return <img key={counter++} src={found[2]} alt={found[1]} />;
            },
            stop: true,
        },
        {
            pattern: /`([^`]+)`/, // Matches inline code `code`
            transform: (match) => <code key={counter++}>${match[0] as string}</code>,
            stop: true,
        },
        {
            pattern: /```([\s\S]*?)```/, // Matches code blocks ```code```
            transform: (match) => <pre key={counter++}><code>${match[0] as string}</code></pre>,
            stop: true,
        },
    ];

    return [...baseRules, ...additionalRules];
};

export const TextPart = (props) => {
    return (
        <Typography
            component="span"
            variant="inherit"
            alignItems="center"
            display="flex"
            gap={2}
            {...props}
        >
            {props.children}
        </Typography>
    );
}

export const markdown = (text: MarkdownString, ...additionalRules: TransformationRule<ReactNode>[]): ReactNode => {
    const theme = useTheme();

    const defaultTransform: TransformFunction<ReactNode> = (match) => {
        return transformReactMatch(match);
    }

    if (typeof text === 'string') {
        // Obsługa przypadku, gdy `text` jest zwykłym ciągiem znaków
        return transform(text, markdownRules(...additionalRules), (match) => (
            <TextPart key={counter++} sx={{ whiteSpace: "pre-wrap" }}>{transformReactMatch(match)}</TextPart>
        ));
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
                        return (
                            <TextPart key={counter++}>
                                {transform(item, markdownRules(...additionalRules), defaultTransform)}
                            </TextPart>
                        );
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
                                    <TextPart
                                        key={counter++}
                                        style={{ textAlign: "left" }}
                                    >
                                        {transform(item[0], markdownRules(...additionalRules), defaultTransform)}
                                    </TextPart>
                                    <TextPart
                                        key={counter++}
                                        style={{ textAlign: "right" }}
                                    >
                                        {transform(item[1], markdownRules(...additionalRules), defaultTransform)}
                                    </TextPart>
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
                                    <TextPart
                                        key={counter++}
                                        style={{ textAlign: "left" }}
                                    >
                                        {transform(item[0], markdownRules(...additionalRules), defaultTransform)}
                                    </TextPart>
                                    <TextPart
                                        key={counter++}
                                        style={{ textAlign: "center", flex: 1 }}
                                    >
                                        {transform(item[1], markdownRules(...additionalRules), defaultTransform)}
                                    </TextPart>
                                    <TextPart
                                        key={counter++}
                                        style={{ textAlign: "right" }}
                                    >
                                        {transform(item[2], markdownRules(...additionalRules), defaultTransform)}
                                    </TextPart>
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
