import React, { useState } from "react";
import Editor, { loader, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { useTheme, useThemeProps } from "@mui/material";
import i18next from "i18next";
import { ToLowerCaseAction } from "./actions/ToLowerCase";
import { ToUpperCaseAction } from "./actions/ToUpperCase";
import { useTranslation } from "react-i18next";

// Konfiguracja MonacoEnvironment dla web workerów
self.MonacoEnvironment = {
    getWorker(_, label) {
        if (label === 'json') {
            return new jsonWorker();
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return new cssWorker();
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return new htmlWorker();
        }
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker();
        }
        return new editorWorker();
    },
};

loader.config({ monaco, "vs/nls": { availableLanguages: { "*": i18next.languages } } });

interface MonacoEditorProps extends React.ComponentProps<typeof Editor> {
    editorKey?: string;
    onFocus?: () => void;
    onBlur?: () => void;
}

const MonacoEditor: React.FC<MonacoEditorProps> = (props) => {
    const { onMount, editorKey, onFocus, onBlur, ...other } = useThemeProps({ name: "MonacoEditor", props });
    const [editorInstance, setEditorInstance] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const { t } = useTranslation();
    const theme = useTheme();

    const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
        setEditorInstance(editor);

        editor.onDidFocusEditorText(() => {
            if (onFocus) onFocus();
        });

        // Obsługa zdarzenia blur
        editor.onDidBlurEditorText(() => {
            if (onBlur) onBlur();
        });

        //editor.saveViewState
        editor.addAction(ToLowerCaseAction(t));
        editor.addAction(ToUpperCaseAction(t));

        if (onMount) {
            onMount(editor, monaco);
        }
    };

    // React.useEffect(() => {
    //     return () => {
    //         // Czyszczenie edytora przy odmontowaniu
    //         if (editorInstance) {
    //             editorInstance.dispose();
    //             setEditorInstance(null);
    //         }
    //     };
    // }, [editorInstance]);

    return (
        <Editor
            defaultLanguage="sql"
            theme={theme.palette.mode === "dark" ? "vs-dark" : "light"}
            options={{
                minimap: { enabled: true },
                stickyScroll: { enabled: true, maxLineCount: 1 },
            }}
            onMount={handleEditorDidMount}
            {...other}
        />
    );
};

export default MonacoEditor;