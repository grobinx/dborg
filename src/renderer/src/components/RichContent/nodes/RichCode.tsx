import React from "react";
import { Paper, useTheme } from "@mui/material";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { vs, vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { IRichCode, IRichContainerDefaults } from "../types";
import clsx from "@renderer/utils/clsx";
import { Optional } from "@renderer/types/universal";
import { resolveRichValue, resolveRichValueFromFunction, RichIcon } from "..";

interface RichCodeProps {
    node: Optional<IRichCode, "type">;
    defaults?: IRichContainerDefaults;
}

const RichCode: React.FC<RichCodeProps> = ({ node, defaults }) => {
    const theme = useTheme();
    const [code, setCode] = React.useState<string | null>(resolveRichValue(node.code));

    React.useEffect(() => {
        resolveRichValueFromFunction(node.code, setCode);
    }, [node.code]);

    return (
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
                    borderRadius: defaults?.radius ?? 4,
                    padding: defaults?.padding ?? 4,
                    fontFamily: defaults?.fontFamilyMonospace ?? "monospace",
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
        ) : <RichIcon node={{ icon: "Loading" }} defaults={defaults} />
    );
};

export default RichCode;
