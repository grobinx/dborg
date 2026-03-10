import React from "react";
import { Paper, useTheme } from "@mui/material";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { vs, vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { IRichCode } from "../types";

interface RichCodeProps {
    node: IRichCode;
}

const RichCode: React.FC<RichCodeProps> = ({ node }) => {
    const theme = useTheme();

    return (
        <SyntaxHighlighter
            language={node.language}
            style={theme.palette.mode === "dark" ? vs2015 : vs}
            showLineNumbers={Boolean(node.lineNumbers)}
            wrapLongLines
            customStyle={{
                borderRadius: '4px',
                marginTop: 0,
                marginBottom: 0,
            }}
            lineNumberStyle={{
            }}
        >
            {node.code}
        </SyntaxHighlighter>
    );
};

export default RichCode;
