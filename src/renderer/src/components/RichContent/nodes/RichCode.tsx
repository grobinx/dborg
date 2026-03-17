import React from "react";
import { Box, useTheme } from "@mui/material";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { vs, vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { IRichCode, IRichEnvironment } from "../types";
import clsx from "@renderer/utils/clsx";
import { Optional } from "@renderer/types/universal";
import RichRenderer, { resolveRichValue, resolveRichValueFromFunction, RichIcon } from "..";
import Tooltip from "@renderer/components/Tooltip";

interface RichCodeProps {
    node: Optional<IRichCode, "type">;
    environment?: IRichEnvironment;
}

const RichCode: React.FC<RichCodeProps> = ({ node, environment }) => {
    const theme = useTheme();
    const [code, setCode] = React.useState<string | null>(resolveRichValue(node.code));

    React.useEffect(() => {
        resolveRichValueFromFunction(node.code, setCode);
    }, [node.code]);

    if (node.excluded) {
        return null;
    }

    const result = (
        code ? (
            <SyntaxHighlighter
                id={node.id}
                hidden={node.hidden}
                key={node.key ?? node.id}
                className={clsx("RichNode-code", node.className)
                }
                language={node.language}
                style={theme.palette.mode === "dark" ? vs2015 : vs}
                showLineNumbers={Boolean(node.lineNumbers)}
                startingLineNumber={node.startLineNumber}
                customStyle={{
                    borderRadius: environment?.theme?.radius ?? 4,
                    padding: environment?.theme?.padding ?? 4,
                    fontFamily: environment?.theme?.fontFamilyMonospace ?? "monospace",
                    fontSize: "0.875em",
                    marginTop: 0, //defaults?.gap ?? 4,
                    marginBottom: 0, //defaults?.gap ?? 4,
                    ...node.style,
                }}
                lineNumberStyle={{
                }}
            >
                {code}
            </SyntaxHighlighter >
        ) : (
            <Box>
                <RichIcon node={{ icon: "Loading" }} environment={environment} />
            </Box>
        )
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

export default RichCode;
