import React, { useState } from "react";
import Editor, { loader, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';
import { Box, Stack, useTheme, useThemeProps } from "@mui/material";
import i18next from "i18next";
import { ToLowerCaseAction } from "./actions/ToLowerCase";
import { ToUpperCaseAction } from "./actions/ToUpperCase";
import { useTranslation } from "react-i18next";
import StatusBar, { StatusBarButton } from "@renderer/app/StatusBar";
import LoadingOverlay from "../useful/LoadingOverlay";

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
    readOnly?: boolean;
    loading?: string | boolean;
    wordWrap?: boolean;
    lineNumbers?: boolean;
    statusBar?: boolean;
    miniMap?: boolean;
}

const MonacoEditor: React.FC<MonacoEditorProps> = (props) => {
    const { 
        onMount, editorKey, onFocus, onBlur, 
        readOnly, loading, wordWrap = false, lineNumbers = true, statusBar = true, miniMap = true, 
        ...other 
    } = useThemeProps({ name: "MonacoEditor", props });
    const [editorInstance, setEditorInstance] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const [cursorPosition, setCursorPosition] = useState<{ line?: number; column?: number }>({ line: undefined, column: undefined });
    const [lineCount, setLineCount] = useState(0);
    const [lineLength, setLineLength] = useState<number | undefined>(undefined);
    const [isReadOnly, setIsReadOnly] = useState(readOnly ?? false);
    const [encoding, setEncoding] = useState("UTF-8");
    const [eolMode, setEolMode] = useState("LF"); // Dodano stan dla trybu końca linii
    const { t } = useTranslation();
    const theme = useTheme();

    const encodingOptions = ["UTF-8", "UTF-16LE", "UTF-16BE", "ISO-8859-2", "Windows-1250"];

    // Funkcja zmiany kodowania (tylko stan lokalny, Monaco nie obsługuje konwersji automatycznie)
    const handleEncodingChange = (value: string) => {
        setEncoding(value);
        // Jeśli chcesz faktycznie konwertować tekst, musisz dodać własną logikę konwersji tutaj
    };

    const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => {
        setEditorInstance(editor);

        // Aktualizacja pozycji kursora
        editor.onDidChangeCursorPosition((_e) => {
            const position = editor.getPosition();
            if (position) {
                setCursorPosition({ line: position.lineNumber, column: position.column });
                setLineLength(editor.getModel()?.getLineLength(position.lineNumber));
            }
            else {
                setCursorPosition({ line: undefined, column: undefined });
                setLineLength(undefined);
            }
        });

        // Aktualizacja liczby linii
        const updateLineCount = () => {
            setLineCount(editor.getModel()?.getLineCount() || 0);
        };
        editor.onDidChangeModelContent(updateLineCount);
        updateLineCount();

        // Sprawdzenie trybu tylko do odczytu
        setIsReadOnly(editor.getOption(monaco.editor.EditorOption.readOnly));

        // Aktualizacja trybu końca linii
        const updateEolMode = () => {
            const eol = editor.getModel()?.getEOL();
            setEolMode(eol === "\r\n" ? "CRLF" : "LF");
        };
        editor.onDidChangeModelContent(updateEolMode);
        updateEolMode();

        editor.onDidFocusEditorText(() => {
            if (onFocus) onFocus();
        });

        // Obsługa zdarzenia blur
        editor.onDidBlurEditorText(() => {
            if (onBlur) onBlur();
        });

        // Dodaj akcje
        editor.addAction(ToLowerCaseAction(t));
        editor.addAction(ToUpperCaseAction(t));

        if (onMount) {
            onMount(editor, monaco);
        }
    };

    React.useEffect(() => {
        return () => {
            if (editorInstance) {
                try {
                    editorInstance.dispose();
                } catch (error) {
                } finally {
                    setEditorInstance(null);
                }
            }
        };
    }, [editorInstance]);

    React.useEffect(() => {
        setIsReadOnly(readOnly ?? false);
    }, [readOnly]);

    return (
        <Stack
            direction="column"
            sx={{
                width: "100%",
                height: "100%",
                overflow: "hidden",
            }}
        >
            <Box
                sx={{
                    position: "relative",
                    flex: 1, // Editor zajmuje pozostałą przestrzeń
                    overflow: "hidden",
                    height: "100%",
                    width: "100%",
                }}
            >
                <Editor
                    defaultLanguage="sql"
                    theme={theme.palette.mode === "dark" ? "vs-dark" : "light"}
                    options={{
                        minimap: { enabled: miniMap },
                        stickyScroll: { enabled: true, maxLineCount: 1 },
                        readOnly: isReadOnly,
                        wordWrap: wordWrap ? "on" : "off",
                        lineNumbers: lineNumbers ? "on" : "off",
                    }}
                    onMount={handleEditorDidMount}
                    {...other}
                />
                {loading && (
                    <LoadingOverlay
                        label={typeof loading === "string" && loading.trim() === "" || loading ? t("loading---", "Loading...") : loading}
                    />
                )}
            </Box>
            {statusBar !== false && (
                <StatusBar>
                    <StatusBarButton
                        key="read-only"
                        toolTip={isReadOnly ? t("editor.statusBar.readOnly", "Read only") : t("editor.statusBar.editable", "Editable")}
                    >
                        {isReadOnly
                            ? <theme.icons.ReadOnlyEditor />
                            : <theme.icons.EditableEditor />}
                    </StatusBarButton>
                    <StatusBarButton key="language-status">
                        {t("editor.statusBar.language", "{{language}}", { language: other.language || "sql" })}
                    </StatusBarButton>
                    <StatusBarButton
                        key="cursor-position"
                        onClick={() => {
                            if (editorInstance) {
                                editorInstance.focus();
                                editorInstance.trigger(null, "editor.action.gotoLine", null);
                            }
                        }}
                    >
                        {t("editor.statusBar.cursorPosition", "Ln {{line}}, Col {{column}}", {
                            line: cursorPosition.line,
                            column: cursorPosition.column,
                        })}
                    </StatusBarButton>
                    <StatusBarButton
                        key="line-length"
                    >
                        {t("editor.statusBar.lineLength", "Len {{length}}", {
                            length: lineLength,
                        })}
                    </StatusBarButton>
                    <StatusBarButton key="line-count">
                        {t("editor.statusBar.lineCount", "{{lineCount}} lines", { lineCount })}
                    </StatusBarButton>
                    {!isReadOnly && (
                        <StatusBarButton
                            key="encoding"
                            options={encodingOptions}
                            optionSelected={encoding}
                            onOptionSelect={handleEncodingChange}
                        >
                            {t("editor.statusBar.encoding", "{{encoding}}", { encoding })}
                        </StatusBarButton>
                    )}
                    {!isReadOnly && (
                        <StatusBarButton
                            key="eol-mode"
                            options={["CRLF", "LF"]}
                            optionSelected={eolMode}
                            onOptionSelect={(value) => {
                                if (editorInstance) {
                                    const newEol = value === "CRLF"
                                        ? monaco.editor.EndOfLineSequence.CRLF
                                        : monaco.editor.EndOfLineSequence.LF;
                                    editorInstance.getModel()?.setEOL(newEol);
                                    setEolMode(value);
                                }
                            }}
                        >
                            {t("editor.statusBar.eolMode", "{{eolMode}}", { eolMode })}
                        </StatusBarButton>
                    )}
                </StatusBar>
            )}
        </Stack>
    );
};

export default MonacoEditor;