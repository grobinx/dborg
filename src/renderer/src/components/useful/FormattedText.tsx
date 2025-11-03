import { Stack, styled, SxProps, Theme, Typography, useTheme } from "@mui/material";
import { resolveIcon } from "@renderer/themes/icons";
import React from "react";
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
    name: "FormattedText",
    slot: "root",
})(() => ({
    whiteSpace: "pre-wrap",
    display: "flex",
    alignItems: "center",
}));

export interface FormattedTextParagraphProps extends React.HTMLAttributes<HTMLSpanElement> {
    children?: React.ReactNode;
}

const FormattedTextParagraph = React.memo<FormattedTextParagraphProps>((props) => {
    return (
        <StyledFormattedTextParagraph
            className="FormattedText-root"
            {...props}
        >
            {props.children}
        </StyledFormattedTextParagraph>
    );
});
FormattedTextParagraph.displayName = 'FormattedTextParagraph';

interface FormattedTextElementProps extends React.ComponentProps<typeof ReactMarkdown> {
    style?: React.CSSProperties;
    sx?: SxProps<Theme>;
}

export const FormattedTextElement = React.memo<FormattedTextElementProps>((props) => {
    const theme = useTheme();

    const components = React.useMemo(() => ({
        p: (props) => <Typography fontSize="inherit" lineHeight="inherit" {...props} />,
        h1: (props) => <Typography variant="h1" {...props} />,
        h2: (props) => <Typography variant="h2" {...props} />,
        h3: (props) => <Typography variant="h3" {...props} />,
        h4: (props) => <Typography variant="h4" {...props} />,
        h5: (props) => <Typography variant="h5" {...props} />,
        h6: (props) => <Typography variant="h6" {...props} />,
        code: Code,
        img: (props) => resolveIcon(theme, props.src, props.alt),
        ...props.components,
    }), [theme, props.components]);

    return (
        <FormattedTextParagraph>
            <ReactMarkdown
                {...props}
                components={components}
            />
        </FormattedTextParagraph>
    );
});
FormattedTextElement.displayName = 'FormattedTextElement';

export interface FormattedTextProps {
    text: FormattedContent;
    style?: React.CSSProperties;
    sx?: SxProps<Theme>;
}

export const FormattedText = React.memo<FormattedTextProps>(({ text, style, sx }) => {
    const theme = useTheme();

    const content = React.useMemo(() => {
        if (typeof text === 'string') {
            return <FormattedTextElement style={style} sx={sx}>{text}</FormattedTextElement>;
        } else if (React.isValidElement(text)) {
            return text;
        } else if (Array.isArray(text)) {
            return (
                <Stack
                    direction="column"
                    gap={1}
                    sx={{ whiteSpace: "pre-wrap", alignItems: "flex-start", alignSelf: "center" }}
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
                            if (React.isValidElement(item)) {
                                return item.key != null
                                    ? item
                                    : React.cloneElement(item, { key: `element-${index}` });
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
                                    {item.map((subItem, subIndex) => {
                                        if (typeof subItem === 'string') {
                                            return <FormattedTextElement key={subIndex} style={style} sx={sx}>{subItem}</FormattedTextElement>;
                                        }
                                        if (React.isValidElement(subItem)) {
                                            return subItem.key != null
                                                ? subItem
                                                : React.cloneElement(subItem, { key: `element-${subIndex}` });
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
    }, [text, style, sx, theme.palette.divider]);

    return content;
});
FormattedText.displayName = 'FormattedText';
