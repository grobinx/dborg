import React, { useState } from "react";
import Editor, { loader, Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import * as sqlFormatter from "sql-formatter";

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
import { Copy } from "react-bootstrap-icons";
import { CopyCodeAs } from "./actions/CopyCodeAs";

// Konfiguracja MonacoEnvironment dla web workerów
if (typeof self !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).MonacoEnvironment = {
        getWorker(_, label) {
            if (label === 'json') return new jsonWorker();
            if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
            if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker();
            if (label === 'typescript' || label === 'javascript') return new tsWorker();
            return new editorWorker();
        },
    };
}

monaco.languages.registerDocumentFormattingEditProvider("sql", {
    provideDocumentFormattingEdits(model) {
        const formatted = sqlFormatter.format(
            model.getValue(),
            {
                language: "postgresql",
                useTabs: false,
                linesBetweenQueries: 1,
                tabWidth: 4,
            }
        );
        return [
            {
                range: model.getFullModelRange(),
                text: formatted,
            },
        ];
    },
});

monaco.languages.registerDocumentRangeFormattingEditProvider("sql", {
    provideDocumentRangeFormattingEdits(model, range) {
        const selectedText = model.getValueInRange(range);
        const formatted = sqlFormatter.format(selectedText, {
            language: "postgresql",
            useTabs: false,
            linesBetweenQueries: 1,
            tabWidth: 4,
        });
        return [
            {
                range,
                text: formatted,
            },
        ];
    },
});

export type EditorEolMode = "CRLF" | "LF";
export const defaultEditorEolMode: EditorEolMode = "CRLF";
export const editorEolModes: EditorEolMode[] = ["CRLF", "LF"];

export type EditorEncoding = "UTF-8" | "UTF-16LE" | "UTF-16BE" | "ISO-8859-2" | "Windows-1250";
export const defaultEditorEncoding: EditorEncoding = "UTF-8";
export const editorEncodings: EditorEncoding[] = ["UTF-8", "UTF-16LE", "UTF-16BE", "ISO-8859-2", "Windows-1250"];

export type EditorLanguageId =
    | "plaintext" | "markdown" | "json" | "yaml"
    | "html" | "css" | "scss" | "less"
    | "javascript" | "typescript"
    | "csharp" | "java" | "python" | "php" | "ruby" | "go"
    | "sql" | "powershell" | "shell" | "xml";
export const defaultEditorLanguageId: EditorLanguageId = "sql";
export const editorLanguageIds: EditorLanguageId[] = [
    "plaintext", "markdown", "json", "yaml",
    "html", "css", "scss", "less",
    "javascript", "typescript",
    "csharp", "java", "python", "php", "ruby", "go",
    "sql", "powershell", "shell", "xml"
];

loader.config({ monaco, "vs/nls": { availableLanguages: { "*": i18next.languages } } });

interface MonacoEditorProps {
    defaultValue?: string;
    editorKey?: string;
    onFocus?: () => void;
    onBlur?: () => void;
    readOnly?: boolean;
    loading?: string | boolean;
    wordWrap?: boolean;
    lineNumbers?: boolean;
    statusBar?: boolean;
    miniMap?: boolean;
    language?: EditorLanguageId;
    encoding?: EditorEncoding;
    eol?: EditorEolMode;
    insertSpaces?: boolean;
    tabSize?: number;
    value?: string;

    onLanguageChange?: (languageId: EditorLanguageId) => void;
    onEncodingChange?: (encoding: EditorEncoding) => void;
    onEolChange?: (eol: EditorEolMode) => void;

    onMount?: (editor: monaco.editor.IStandaloneCodeEditor, monacoApi: Monaco) => void;
}

const MonacoEditor: React.FC<MonacoEditorProps> = (props) => {
    const {
        onMount, editorKey, onFocus, onBlur, defaultValue, value,
        readOnly, loading, wordWrap = false, lineNumbers = true, statusBar = true, miniMap = true,
        language: initialLanguage = defaultEditorLanguageId,
        encoding: initialEncoding = defaultEditorEncoding,
        eol: initialEol = defaultEditorEolMode,
        insertSpaces: initialInsertSpaces = true,
        tabSize: initialTabSize = 4,
        onLanguageChange, onEncodingChange, onEolChange,
        ...other
    } = useThemeProps({ name: "MonacoEditor", props });

    const theme = useTheme();
    const { t } = useTranslation();
    const [editorInstance, setEditorInstance] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const [cursorPosition, setCursorPosition] = useState<{ line?: number; column?: number }>({ line: undefined, column: undefined });
    const [lineCount, setLineCount] = useState(0);
    const [lineLength, setLineLength] = useState<number | undefined>(undefined);
    const [isReadOnly, setIsReadOnly] = useState(readOnly ?? false);
    const [encoding, setEncoding] = useState<EditorEncoding>(initialEncoding);
    const [eol, setEol] = useState<EditorEolMode>(initialEol);
    const [language, setLanguage] = useState<EditorLanguageId>(initialLanguage);
    const [insertSpaces, setInsertSpaces] = useState<boolean>(initialInsertSpaces);
    const [tabSize, setTabSize] = useState<number>(initialTabSize);
    const [dialog, setDialog] = useState<React.ReactNode>(null);

    React.useEffect(() => {
        setLanguage(initialLanguage);
    }, [initialLanguage]);

    React.useEffect(() => {
        setEncoding(initialEncoding);
    }, [initialEncoding]);

    React.useEffect(() => {
        setEol(initialEol);
    }, [initialEol]);

    React.useEffect(() => {
        setInsertSpaces(initialInsertSpaces);
    }, [initialInsertSpaces]);

    React.useEffect(() => {
        setTabSize(initialTabSize);
    }, [initialTabSize]);

    const handleEncodingChange = (value: EditorEncoding) => {
        setEncoding(value);
        onEncodingChange?.(value); // powiadom warstwę I/O
    };

    const handleLanguageChange = (value: EditorLanguageId) => {
        setLanguage(value);
        // zmiana języka modelu w monaco
        const model = editorInstance?.getModel();
        if (model && value) {
            monaco.editor.setModelLanguage(model, value);
        }
        onLanguageChange?.(value); // powiadom warstwę I/O
    };

    const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monacoApi: Monaco) => {
        setEditorInstance(editor);

        const disposables: monaco.IDisposable[] = [];

        // Aktualizacja pozycji kursora
        disposables.push(editor.onDidChangeCursorPosition((_e) => {
            const position = editor.getPosition();
            if (position) {
                setCursorPosition({ line: position.lineNumber, column: position.column });
                setLineLength(editor.getModel()?.getLineLength(position.lineNumber));
            } else {
                setCursorPosition({ line: undefined, column: undefined });
                setLineLength(undefined);
            }
        }));

        // Aktualizacja liczby linii
        const updateLineCount = () => setLineCount(editor.getModel()?.getLineCount() || 0);
        disposables.push(editor.onDidChangeModelContent(updateLineCount));
        updateLineCount();

        // Sprawdzenie trybu tylko do odczytu
        setIsReadOnly(editor.getOption(monacoApi.editor.EditorOption.readOnly));

        // Aktualizacja trybu końca linii
        const updateEolMode = () => {
            const eol = editor.getModel()?.getEOL();
            const newMode = eol === "\r\n" ? "CRLF" : "LF";
            setEol(newMode);
            onEolChange?.(newMode); // powiadom warstwę I/O przy zmianach treści wpływających na EOL
        };
        disposables.push(editor.onDidChangeModelContent(updateEolMode));
        updateEolMode();

        disposables.push(editor.onDidFocusEditorText(() => onFocus?.()));
        disposables.push(editor.onDidBlurEditorText(() => onBlur?.()));

        // Dodaj akcje
        editor.addAction(ToLowerCaseAction(t));
        editor.addAction(ToUpperCaseAction(t));
        editor.addAction(CopyCodeAs((dialog) => setDialog(dialog)));

        // Ustaw początkowy język modelu na podstawie state
        const model = editor.getModel();
        if (model && language) {
            monaco.editor.setModelLanguage(model, language);
        }

        if (onMount) onMount(editor, monacoApi);

        // Store disposables on the editor for cleanup
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (editor as any).__dborgDisposables = disposables;
    };

    React.useEffect(() => {
        return () => {
            if (editorInstance) {
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const disposables: monaco.IDisposable[] = (editorInstance as any).__dborgDisposables || [];
                    disposables.forEach(d => {
                        try { d.dispose(); } catch { }
                    });
                    editorInstance.dispose();
                } catch { }
                finally {
                    setEditorInstance(null);
                }
            }
        };
    }, [editorInstance]);

    React.useEffect(() => {
        setIsReadOnly(readOnly ?? false);
        if (editorInstance) {
            editorInstance.updateOptions({ readOnly: readOnly ?? false });
        }
    }, [readOnly, editorInstance]);

    React.useEffect(() => {
        if (editorInstance) {
            editorInstance.updateOptions({
                wordWrap: wordWrap ? "on" : "off",
                lineNumbers: lineNumbers ? "on" : "off",
                minimap: { enabled: miniMap },
                stickyScroll: { enabled: true, maxLineCount: 1 },
                insertSpaces,
                tabSize,
            });
        }
    }, [wordWrap, lineNumbers, miniMap, insertSpaces, tabSize, editorInstance]);

    // aktualizuj język, jeśli zmieni się props.language z zewnątrz
    React.useEffect(() => {
        if (language && language !== language) {
            setLanguage(language);
            const model = editorInstance?.getModel();
            if (model) {
                monaco.editor.setModelLanguage(model, language);
                onLanguageChange?.(language);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [language, editorInstance]);

    React.useEffect(() => {
        if (editorInstance) {
            editorInstance.getModel()?.setEOL(eol === "CRLF"
                ? monaco.editor.EndOfLineSequence.CRLF
                : monaco.editor.EndOfLineSequence.LF);
        }
    }, [eol, editorInstance]);

    const loadingLabel =
        typeof loading === "string"
            ? (loading.trim() === "" ? t("loading---", "Loading...") : loading)
            : (loading ? t("loading---", "Loading...") : undefined);

    return (
        <Stack direction="column" sx={{ width: "100%", height: "100%", overflow: "hidden" }}>
            <Box sx={{ position: "relative", flex: 1, overflow: "hidden", height: "100%", width: "100%" }}>
                <Editor
                    defaultValue={defaultValue}
                    value={value}
                    key={editorKey}
                    defaultLanguage={language}
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
                {Boolean(loading) && (
                    <LoadingOverlay label={loadingLabel} />
                )}
            </Box>
            {statusBar !== false && (
                <StatusBar
                    buttons={{
                        first: [
                            <StatusBarButton
                                key="read-only"
                                toolTip={isReadOnly ? t("editor.statusBar.readOnly", "Read only") : t("editor.statusBar.editable", "Editable")}
                            >
                                {isReadOnly
                                    ? <theme.icons.ReadOnlyEditor />
                                    : <theme.icons.EditableEditor />}
                            </StatusBarButton>,
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
                            </StatusBarButton>,
                            <StatusBarButton
                                key="line-length"
                            >
                                {t("editor.statusBar.lineLength", "Len {{length}}", {
                                    length: lineLength,
                                })}
                            </StatusBarButton>,
                            <StatusBarButton key="line-count">
                                {t("editor.statusBar.lineCount", "{{lineCount}} lines", { lineCount })}
                            </StatusBarButton>,
                        ],
                        last: [
                            <StatusBarButton key="language-status"
                                options={editorLanguageIds}
                                optionSelected={language}
                                onOptionSelect={handleLanguageChange}
                            >
                                {t("editor.statusBar.language", "{{language}}", { language: language })}
                            </StatusBarButton>,
                            ...(!isReadOnly ? [
                                <StatusBarButton
                                    key="indentation"
                                    onClick={() => {
                                        if (editorInstance) {
                                            editorInstance.trigger(null, 'editor.action.showCommands', null);
                                        }
                                    }}
                                >
                                    {t("editor.statusBar.indentation", "{{type}}: {{size}}", {
                                        type: insertSpaces ? t("editor.statusBar.spaces", "Spaces") : t("editor.statusBar.tabs", "Tabs"),
                                        size: tabSize,
                                    })}
                                </StatusBarButton>,
                                <StatusBarButton
                                    key="encoding"
                                    options={editorEncodings}
                                    optionSelected={encoding}
                                    onOptionSelect={handleEncodingChange}
                                >
                                    {t("editor.statusBar.encoding", "{{encoding}}", { encoding })}
                                </StatusBarButton>,
                                <StatusBarButton
                                    key="eol-mode"
                                    options={editorEolModes}
                                    optionSelected={eol}
                                    onOptionSelect={(value) => {
                                        if (editorInstance) {
                                            const newEol = value === "CRLF"
                                                ? monaco.editor.EndOfLineSequence.CRLF
                                                : monaco.editor.EndOfLineSequence.LF;
                                            editorInstance.getModel()?.setEOL(newEol);
                                            setEol(value);
                                            onEolChange?.(value); // powiadom warstwę I/O
                                        }
                                    }}
                                >
                                    {t("editor.statusBar.eolMode", "{{eolMode}}", { eolMode: eol })}
                                </StatusBarButton>,
                            ] : []),
                        ],
                    }}
                />
            )}
            {dialog}
        </Stack >
    );
};

export default MonacoEditor;