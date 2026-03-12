import React from "react";
import { Paper, useTheme } from "@mui/material";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { vs, vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { IRichCode, IRichContainerDefaults } from "../types";

interface RichCodeProps {
    node: IRichCode;
    defaults?: IRichContainerDefaults;
}

const RichCode: React.FC<RichCodeProps> = ({ node, defaults }) => {
    const theme = useTheme();

    return (
        <SyntaxHighlighter
            className="RichNode-code"
            language={node.language}
            style={theme.palette.mode === "dark" ? vs2015 : vs}
            showLineNumbers={Boolean(node.lineNumbers)}
            startingLineNumber={node.startLineNumber}
            customStyle={{
                borderRadius: defaults?.radius ?? 4,
                padding: defaults?.padding ?? 4,
                fontFamily: defaults?.fontFamilyMonospace ?? "monospace",
                fontSize: defaults?.fontSize ?? "0.875rem",
                marginTop: defaults?.gap ?? 4,
                marginBottom: defaults?.gap ?? 4,
            }}
            lineNumberStyle={{
            }}
        >
            {node.code}
        </SyntaxHighlighter>
    );
};

export default RichCode;
