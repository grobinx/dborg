import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { IRichContainerDefaults, IRichText, RichSeverity, RichTextVariant } from "../types";
import { getSeverityColor } from "..";
import { FormattedText } from "@renderer/components/useful/FormattedText";
import Markdown from "react-markdown";
import Code from "@renderer/components/Code";
import { defaults } from "pg";

interface RichTextProps {
    node: IRichText;
    defaults?: IRichContainerDefaults;
}

const RichText: React.FC<RichTextProps> = ({ node, defaults }) => {
    const theme = useTheme();

    const getVariantMapping = (variant?: RichTextVariant) => {
        switch (variant) {
            case "body":
                return "body1";
            case "caption":
                return "subtitle2";
            case "label":
                return "label";
            case "title":
                return "h6";
            case "description":
                return "description";
            default:
                return "body2";
        }
    };

    if (node.variant === "markdown") {
        return (
            <Box sx={{ color: getSeverityColor(node.severity, theme) }}>
                <Markdown
                    components={React.useMemo(() => ({
                        p: (props) => <Typography {...props} component="span" className="paragraph" fontSize="inherit" fontWeight="inherit" lineHeight="inherit" padding={defaults?.padding ?? 8} />,
                        h1: (props) => <Typography variant="h1" fontSize="3em" {...props} />,
                        h2: (props) => <Typography variant="h2" fontSize="2.7em" {...props} />,
                        h3: (props) => <Typography variant="h3" fontSize="2.4em" {...props} />,
                        h4: (props) => <Typography variant="h4" fontSize="2em" {...props} />,
                        h5: (props) => <Typography variant="h5" fontSize="1.5em" {...props} />,
                        h6: (props) => <Typography variant="h6" fontSize="1.17em" {...props} />,
                        code: Code,
                    }), [theme, defaults])}
                >
                {node.text}
            </Markdown>
            </Box >
        )
    }

return (
    <Typography
        variant={getVariantMapping(node.variant) as any}
        sx={{ color: getSeverityColor(node.severity, theme) }}
    >
        {node.text}
    </Typography>
);
};

export default RichText;
