import React, { useImperativeHandle, useState } from "react";
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
import { TransformToLowerCaseAction } from "./actions/TransformToLowerCase";
import { TransformToUpperCaseAction } from "./actions/TransformToUpperCase";
import { useTranslation } from "react-i18next";
import StatusBar, { StatusBarButton } from "@renderer/app/StatusBar";
import LoadingOverlay from "../useful/LoadingOverlay";
import { CopyCodeAs } from "./actions/CopyCodeAs";
import { LoadingOverlayMode } from "../useful/spinners/core";
import { exportMonacoActionsToActionManager } from "./MonacoActionExporter";
import { ActionManager } from "../CommandPalette/ActionManager";

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

export interface IEditorActionContext {
    editor: () => monaco.editor.IStandaloneCodeEditor | null;
    actionManager: () => ActionManager<IEditorActionContext>;
}

interface MonacoEditorProps {
    ref?: React.Ref<IEditorActionContext>;
    rootRef?: React.Ref<HTMLDivElement>;
    defaultValue?: string;
    editorKey?: string;
    onFocus?: () => void;
    onBlur?: () => void;
    readOnly?: boolean;
    wordWrap?: boolean;
    lineNumbers?: boolean;
    statusBar?: boolean | "simple";
    miniMap?: boolean;
    language?: EditorLanguageId;
    encoding?: EditorEncoding;
    eol?: EditorEolMode;
    insertSpaces?: boolean;
    tabSize?: number;
    value?: string;
    width?: string | number;
    height?: string | number;

    onLanguageChange?: (languageId: EditorLanguageId) => void;
    onEncodingChange?: (encoding: EditorEncoding) => void;
    onEolChange?: (eol: EditorEolMode) => void;

    onMount?: (editor: monaco.editor.IStandaloneCodeEditor, monacoApi: Monaco) => void;

    loading?: string | boolean;
    onCancel?: () => void;
    overlayMode?: LoadingOverlayMode;

    topChildren?: React.ReactNode;
}

const MonacoEditor: React.FC<MonacoEditorProps> = (props) => {
    const {
        onMount, editorKey, onFocus, onBlur, defaultValue, value, rootRef, ref,
        readOnly, wordWrap = false, lineNumbers = true, statusBar = true, miniMap = true,
        language: initialLanguage = defaultEditorLanguageId,
        encoding: initialEncoding = defaultEditorEncoding,
        eol: initialEol = defaultEditorEolMode,
        insertSpaces: initialInsertSpaces = true,
        tabSize: initialTabSize = 4, width, height,
        onLanguageChange, onEncodingChange, onEolChange,
        loading, onCancel, overlayMode,
        topChildren,
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
    const [changeTabSize, setChangeTabSize] = useState<boolean>(false);
    const actionManagerRef = React.useRef<ActionManager<IEditorActionContext>>(new ActionManager<IEditorActionContext>());

    const editorContext: IEditorActionContext = {
        editor: () => editorInstance!,
        actionManager: () => actionManagerRef.current,
    };

    useImperativeHandle(ref, () => editorContext, [editorContext]);

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
        editor.addAction(TransformToLowerCaseAction(t));
        editor.addAction(TransformToUpperCaseAction(t));
        editor.addAction(CopyCodeAs((dialog) => setDialog(dialog)));

        // Ustaw początkowy język modelu na podstawie state
        const model = editor.getModel();
        if (model && language) {
            monaco.editor.setModelLanguage(model, language);
        }

        if (onMount) onMount(editor, monacoApi);

        actionManagerRef.current.registerAction(...exportMonacoActionsToActionManager(editor, {
            include: (id) =>
                id.startsWith("editor.action.") ||
                id.startsWith("actions."),
            iconById: {},
        }));

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

    // Dopasuj szerokość kolumny numerów linii do liczby wierszy
    React.useEffect(() => {
        if (editorInstance) {
            const digits = Math.max(3, Math.ceil(Math.log10((lineCount || 1) + 1))) + 1;
            editorInstance.updateOptions({ lineNumbersMinChars: digits });
        }
    }, [lineCount, editorInstance]);

    const loadingLabel =
        typeof loading === "string"
            ? (loading.trim() === "" ? t("loading---", "Loading...") : loading)
            : (loading ? t("loading---", "Loading...") : undefined);

    return (
        <Stack direction="column" sx={{ width: width ?? "100%", height: height ?? "100%", maxWidth: width, overflow: "hidden" }} ref={rootRef}>
            {topChildren}
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
                    <LoadingOverlay label={loadingLabel} onCancelLoading={onCancel} mode={overlayMode} />
                )}
            </Box>
            {statusBar !== false && (
                <StatusBar
                    buttons={{
                        first: [
                            <StatusBarButton
                                key="read-only"
                                toolTip={isReadOnly ? t("editor.statusBar.readOnlyTooltip", "Read only") : t("editor.statusBar.editableTooltip", "Editable")}
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
                                toolTip={t("editor.statusBar.gotoLineTooltip", "Position. Go to Line")}
                            >
                                {statusBar !== "simple" ?
                                    t("editor.statusBar.cursorPosition", "Ln {{line}}, Col {{column}}", {
                                        line: cursorPosition.line,
                                        column: cursorPosition.column,
                                    }) :
                                    t("editor.statusBar.cursorPosition-short", "{{line}}:{{column}}", {
                                        line: cursorPosition.line,
                                        column: cursorPosition.column,
                                    })
                                }
                            </StatusBarButton>,
                            statusBar !== "simple" && (
                                <StatusBarButton
                                    key="line-length"
                                    toolTip={t("editor.statusBar.lineLengthTooltip", "Current line length")}
                                >
                                    {t("editor.statusBar.lineLength", "Len {{length}}", {
                                        length: lineLength,
                                    })}
                                </StatusBarButton>
                            ),
                            <StatusBarButton
                                key="line-count"
                                toolTip={t("editor.statusBar.lineCountTooltip", "Total number of lines")}
                            >
                                {statusBar !== "simple" ?
                                    t("editor.statusBar.lineCount", "{{lineCount}} lines", { lineCount }) :
                                    t("editor.statusBar.lineCount-short", "{{lineCount}} l", { lineCount })
                                }
                            </StatusBarButton>,
                        ],
                        last: [
                            <StatusBarButton key="language-status"
                                options={editorLanguageIds}
                                optionSelected={language}
                                onOptionSelect={handleLanguageChange}
                                toolTip={t("editor.statusBar.languageTooltip", "Select language")}
                            >
                                {t("editor.statusBar.language", "{{language}}", { language: language })}
                            </StatusBarButton>,
                            ...(!isReadOnly ? [
                                <StatusBarButton
                                    key="indentation"
                                    options={
                                        !changeTabSize ? [
                                            { label: t("editor.statusBar.indentWithSpaces", "Indent with Spaces"), value: "iws" },
                                            { label: t("editor.statusBar.indentWithTabs", "Indent with Tabs"), value: "iwt" },
                                            { label: t("editor.statusBar.changeTabSize", "Change Tab Size"), value: "cts" },
                                        ] : [1, 2, 3, 4, 5, 6, 7, 8]
                                    }
                                    optionSelected={!changeTabSize ? (insertSpaces ? "iws" : "iwt") : tabSize}
                                    onOptionSelect={(value) => {
                                        if (value === 'iws') {
                                            editorInstance?.updateOptions({ insertSpaces: true });
                                            setInsertSpaces(true);
                                        } else if (value === 'iwt') {
                                            editorInstance?.updateOptions({ insertSpaces: false });
                                            setInsertSpaces(false);
                                        } else if (value === 'cts') {
                                            setChangeTabSize(true);
                                            return false;
                                        } else if (typeof value === 'number') {
                                            setTabSize(value);
                                        }
                                    }}
                                    toolTip={t("editor.statusBar.indentationTooltip", "Change indentation settings")}
                                    onOptionsClose={() => setTimeout(() => setChangeTabSize(false), 100)}
                                >
                                    {t("editor.statusBar.indentation", "{{type}}: {{size}}", {
                                        type: statusBar !== "simple" ?
                                            (insertSpaces ? t("editor.statusBar.spaces", "Spaces") : t("editor.statusBar.tabs", "Tabs")) :
                                            (insertSpaces ? t("editor.statusBar.spaces-short", "Sp") : t("editor.statusBar.tabs-short", "Tbs")),
                                        size: tabSize,
                                    })}
                                </StatusBarButton>,
                                <StatusBarButton
                                    key="encoding"
                                    options={editorEncodings}
                                    optionSelected={encoding}
                                    onOptionSelect={handleEncodingChange}
                                    toolTip={t("editor.statusBar.encodingTooltip", "Select encoding")}
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
                                    toolTip={t("editor.statusBar.eolModeTooltip", "Select end of line mode")}
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