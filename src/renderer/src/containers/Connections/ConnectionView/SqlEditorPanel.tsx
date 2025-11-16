import MonacoEditor from "@renderer/components/editor/MonacoEditor";
import React, { useRef, useEffect } from "react";
import * as monaco from "monaco-editor";
import { Monaco } from "@monaco-editor/react";
import { ExecuteQueryAction } from "./editor/actions/ExecuteQueryAction";
import { useTranslation } from "react-i18next";
import { useTheme } from "@mui/material";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import EditorContentManager from "@renderer/contexts/EditorContentManager";
import { useToast } from "@renderer/contexts/ToastContext";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { useDialogs } from "@toolpad/core";
import { SelectCurrentCommand } from "./editor/actions/SelectCurrentCommand";
import { Messages, useMessages } from "@renderer/contexts/MessageContext";
import { SQL_EDITOR_ADD, SQL_EDITOR_CLOSE, SQL_EDITOR_DELETE, SQL_EDITOR_MENU_REOPEN } from "./EdiorsTabs";
import { AddSqlEditorTab } from "./editor/actions/AddSqlEditorTab";
import { CloseSqlEditorTab } from "./editor/actions/CloseSqlEditorTab";
import { MenuReopenSqlEditorTab } from "./editor/actions/MenuReopenSqlEditorTab";
import { DatabaseMetadata } from "src/api/db";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { getFragmentAroundCursor, getNextNeighbor, getPrevNeighbor, getStringTypeAroundCursor, resolveWordAlias } from "@renderer/components/editor/editorUtils";
import { AstComponent, SqlAnalyzer, SqlAstBuilder, SqlTokenizer, Token } from "sql-taaf";
import { MetadataCommandProcessor } from "./MetadataCommandProcessor";
import { useTabs } from "@renderer/components/TabsPanel/useTabs";
import { use } from "i18next";
import { SQL_RESULT_FOCUS } from "./SqlResultPanel";
import Tooltip from "@renderer/components/Tooltip";
import { ToolButton } from "@renderer/components/buttons/ToolButton";
//import { SqlParser } from "@renderer/components/editor/SqlParser";

export const SQL_EDITOR_FIRST_LINE_CHANGED = "sql-editor:first-line-changed";
export const SQL_EDITOR_EXECUTE_QUERY = "sql-editor:execute-query";
export const SQL_EDITOR_SHOW_STRUCTURE = "sql-editor:show-structure";

export const SQL_EDITOR_FOCUS = "sql-editor:focus";
export interface SqlEditorFocusMessage {
    sessionId: string;
}

interface SqlEditorContentProps {
    session: IDatabaseSession;
    tabsItemID?: string;
    itemID?: string;
    editorContentManager: EditorContentManager; // Dodano EditorContentManager jako prop
}

export const SqlEditorContent: React.FC<SqlEditorContentProps> = (props) => {
    const { session, tabsItemID, itemID, editorContentManager } = props;
    const addToast = useToast();
    const { t } = useTranslation();
    const firstLineRef = useRef<string>("");
    const contentLoadedRef = useRef(false);
    const [editorInstance, setEditorInstance] = React.useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const editorInstanceRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const updateCursorPositionRef = useRef<() => void>(() => { }); // Referencja na funkcję
    const updateEditorContentRef = useRef<() => void>(() => { }); // Referencja na funkcję
    const { subscribe, queueMessage } = useMessages();
    const databaseMetadataRef = React.useRef<DatabaseMetadata | null>(null);
    const hoverProviderRef = useRef<monaco.IDisposable | null>(null);
    const editorFocusedRef = useRef(false);
    const currentFragmentRef = useRef<string | null>(null);
    const currentSqlAstRef = useRef<AstComponent[] | null>(null);
    const { tabIsActiveRef } = useTabs(tabsItemID, itemID, () => {
        if (editorInstance) {
            editorInstance.focus();
        }
    });

    useEffect(() => {
        editorInstanceRef.current = editorInstance;
    }, [editorInstance]);

    const addHoverProvider = () => {
        if (hoverProviderRef.current || !editorFocusedRef.current) {
            return;
        }

        hoverProviderRef.current = monaco.languages.registerHoverProvider("sql", {
            provideHover: (model, position) => {
                const word = model.getWordAtPosition(position);
                if (word) {
                    const { fragment, startLine, endLine, relativeOffset } = getFragmentAroundCursor(editorInstance!, position)!;
                    const stringType = getStringTypeAroundCursor(model, position, startLine, endLine);
                    const previousWord = getPrevNeighbor(model, position);
                    const nextWord = getNextNeighbor(model, position);
                    let sourceResolved = resolveWordAlias(fragment, previousWord ? previousWord : word.word);
                    // const parser = new SqlParser();
                    // const result = parser.parse(fragment);
                    // console.log(result.map((token) => ({ value: token.value, type: token.type })));

                    if (fragment !== currentFragmentRef.current) {
                        // @todo: tutaj trzeba dodać obsługę ewentualnych dodatkowych znaków identyfikatorów
                        // zależnie od sterownika. W sterowniku powinny znaleźć się informacje o takich znakach
                        currentFragmentRef.current = fragment;
                        const tokenizer = new SqlTokenizer();
                        const tokens: Token[] = tokenizer.parse(fragment);
                        const astBuilder = new SqlAstBuilder();
                        const ast = astBuilder.build(tokens);
                        currentSqlAstRef.current = ast;
                    }
                    if (currentSqlAstRef.current) {
                        const analyzer = new SqlAnalyzer();
                        const identifier = analyzer.findIdentifierAt(currentSqlAstRef.current[0], relativeOffset);
                        if (identifier) {
                            return {
                                contents: [
                                    { value: `${identifier.parts.join(".")}` },
                                ]
                            }
                        }
                    }

                    return {
                        range: new monaco.Range(
                            position.lineNumber,
                            word.startColumn,
                            position.lineNumber,
                            word.endColumn
                        ),
                        contents: [
                            { value: `**${word.word}** ${itemID}` },
                            { value: `String type: ${stringType ? stringType : "none"}` },
                            { value: `Previous word: ${previousWord ? previousWord : "none"}` },
                            { value: `Next word: ${nextWord ? nextWord : "none"}` },
                            { value: `Space name: ${sourceResolved.spaceName}, Object name: ${sourceResolved.objectName}` },
                            { value: "This is additional information about the word." },
                        ],
                    };
                }
                return null;
            },
        });
    };

    useEffect(() => {
        const handleEditorFocus = () => {
            editorFocusedRef.current = true;
            addHoverProvider();
        };

        const handleEditorBlur = () => {
            editorFocusedRef.current = false;
            if (hoverProviderRef.current) {
                hoverProviderRef.current.dispose();
                hoverProviderRef.current = null;
            }
        };

        if (editorInstance) {
            editorInstance.onDidFocusEditorText(handleEditorFocus);
            editorInstance.onDidBlurEditorText(handleEditorBlur);
        }

        // return () => {
        //     if (editorInstance) {
        //         editorInstance.onDidFocusEditorText(handleEditorFocus);
        //         editorInstance.onDidBlurEditorText(handleEditorBlur);
        //     }
        // };
    }, [editorInstance, itemID]);

    useEffect(() => {
        const initMetadata = () => {
            if (session.metadata && !databaseMetadataRef.current) {
                databaseMetadataRef.current = Object.values(session.metadata).find((db) => db.connected) || null;
                addHoverProvider();
            };
        }
        const metadataSuccessHandler = (message: Messages.SessionGetMetadataSuccess) => {
            if (message.connectionId === session.info.uniqueId) {
                initMetadata();
            }
        }
        initMetadata();

        const unsubscribeGetMetadataSuccess = subscribe(Messages.SESSION_GET_METADATA_SUCCESS, metadataSuccessHandler);
        const unsubscribeFocus = subscribe(SQL_EDITOR_FOCUS, (message: SqlEditorFocusMessage) => {
            if (message.sessionId === session.info.uniqueId && editorInstanceRef.current && tabIsActiveRef.current) {
                editorInstanceRef.current.focus();
            }
        });
        return () => {
            unsubscribeGetMetadataSuccess();
            unsubscribeFocus();
        };
    }, [session]);

    const updateCursorPosition = () => {
        if (editorInstance && itemID) {
            const position = editorInstance.getPosition();
            const topLine = editorInstance.getScrollTop();
            if (position) {
                editorContentManager.setPosition(itemID, {
                    top: topLine,
                    line: position.lineNumber,
                    column: position.column,
                });
            }
        }
    };

    const updateEditorContent = () => {
        if (editorInstance && itemID) {
            const model = editorInstance.getModel();
            if (model) {
                const newContent = model.getValue(); // Ustaw nową zawartość w modelu edytora
                editorContentManager.setContent(itemID, newContent); // Zaktualizuj zawartość w EditorContentManager
            }
        }
    };

    const processFirstLine = (firstLine: string) => {
        const trimmedContent = firstLine.trim();

        let isComment = false;
        let strippedContent = "";

        // Sprawdź, czy linia zaczyna się od "--" lub "/*"
        if (trimmedContent.startsWith("--") || trimmedContent.startsWith("/*")) {
            strippedContent = trimmedContent.replace(/^--|\/\*|\*\/$/g, "").trim();
            isComment = strippedContent !== "";
        }

        if (isComment) {
            editorContentManager.setLabel(itemID!, strippedContent);
        } else {
            editorContentManager.setLabel(itemID!, null);
        }

        queueMessage(SQL_EDITOR_FIRST_LINE_CHANGED, {
            isComment,
            content: strippedContent,
            itemID,
        });
    };

    useEffect(() => {
        updateCursorPositionRef.current = updateCursorPosition;
        updateEditorContentRef.current = updateEditorContent;

        if (itemID && editorInstance && !contentLoadedRef.current) {
            editorContentManager.getContent(itemID).then((content) => {
                if (editorInstance) {
                    const model = editorInstance.getModel();
                    if (model) {
                        model.setValue(content);
                        processFirstLine(content.split("\n")[0]);
                        const state = editorContentManager.getState(itemID);
                        if (state) {
                            editorInstance.setPosition({
                                lineNumber: state.position.line,
                                column: state.position.column,
                            });
                            editorInstance.setScrollTop(state.position.top);
                        }
                    }
                }
            }).catch((error) => {
                addToast(
                    "error", t("error-loading-editor-content", "Error loading editor content"),
                    {
                        reason: error,
                        source: "SqlEditorContent",
                    },
                );
            }).finally(() => {
                contentLoadedRef.current = true;
            });
        }
        return () => {
            if (editorInstance && contentLoadedRef.current && itemID && editorContentManager.getState(itemID)) {
                updateCursorPositionRef.current();
                updateEditorContentRef.current();
                editorContentManager.saveContent(itemID!);
                editorContentManager.saveStates();
            }
        };
    }, [editorContentManager, itemID, editorInstance]);

    const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, _monaco: Monaco) => {
        setEditorInstance(editor); // Ustaw editor w stanie

        // Dodanie polecenia do listy poleceń edytora
        editor.addAction(ExecuteQueryAction(t, (query: string) => {
            if ((query ?? "").trim() === "") {
                return;
            }

            let result: {
                columns: ColumnDefinition[];
                rows: any[];
            } | null = null;

            if (session.metadata) {
                result = MetadataCommandProcessor.processCommand(query, session.metadata);
                if (result) {
                    queueMessage(SQL_EDITOR_SHOW_STRUCTURE, {
                        to: session.info.uniqueId,
                        from: itemID,
                        data: result.rows,
                        columns: result.columns,
                    });
                    return;
                }
            }

            queueMessage(SQL_EDITOR_EXECUTE_QUERY, {
                to: session.info.uniqueId,
                from: itemID,
                query: query,
            });
        }));
        editor.addAction(SelectCurrentCommand(t));
        editor.addAction(AddSqlEditorTab(t, () => { queueMessage(SQL_EDITOR_ADD, { tabsItemID }); }));
        editor.addAction(CloseSqlEditorTab(t, () => { queueMessage(SQL_EDITOR_CLOSE, itemID); }));
        editor.addAction(MenuReopenSqlEditorTab(t, () => { queueMessage(SQL_EDITOR_MENU_REOPEN, { tabsItemID }); }));
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Tab, () => {
            queueMessage(SQL_RESULT_FOCUS, { sessionId: session.info.uniqueId });
        });

        // Nasłuchiwanie zmian w pozycji kursora
        editor.onDidChangeCursorPosition((_e: monaco.editor.ICursorPositionChangedEvent) => {
            if (contentLoadedRef.current) {
                updateCursorPositionRef.current();
            }
        });

        // Nasłuchiwanie zmian w zawartości edytora
        let contentChangeTimeout: NodeJS.Timeout | null = null;

        editor.onDidChangeModelContent((_e: monaco.editor.IModelContentChangedEvent) => {
            const model = editor.getModel();
            if (!model || !contentLoadedRef.current) return;

            const newContent = model.getValue();

            if (contentChangeTimeout) {
                clearTimeout(contentChangeTimeout);
            }

            contentChangeTimeout = setTimeout(() => {
                editorContentManager.setContent(itemID!, newContent);
                editorContentManager.setOpen(itemID!, true);

                const newFirstLine = model.getLineContent(1);
                if (newFirstLine !== firstLineRef.current) {
                    firstLineRef.current = newFirstLine;
                    processFirstLine(newFirstLine);
                }
            }, 1000);
        });
    };

    return (
        <MonacoEditor
            defaultValue=""
            onMount={handleEditorDidMount}
            language="sql"
        />
    );
};

interface SqlEditorButtonsProps {
    session: IDatabaseSession,
    itemID?: string,
}

export const SqlEditorButtons: React.FC<SqlEditorButtonsProps> = (props) => {
    const { session, itemID } = props;
    const { t } = useTranslation();
    const theme = useTheme();
    const dialogs = useDialogs();
    const { queueMessage } = useMessages();

    const handleDeleteSqlEditor = () => {
        if (itemID) {
            dialogs.confirm(
                t("delete-sql-editor-tab-confirm", "Are you sure you want to delete this SQL Editor tab? This action cannot be undone."),
                {
                    title: t("delete-sql-editor-tab", "Delete content of SQL Editor tab"),
                    severity: "warning",
                    okText: t("delete", "Delete"),
                    cancelText: t("cancel", "Cancel"),
                }
            ).then((result) => {
                if (result) {
                    queueMessage(SQL_EDITOR_DELETE, itemID);
                }
            });
        }
    }

    return (
        <TabPanelButtons>
            <Tooltip title={t("delete-sql-editor-tab", "Delete SQL Editor tab")}>
                <ToolButton
                    onClick={handleDeleteSqlEditor}
                    size="small"
                >
                    <theme.icons.Delete color="error" />
                </ToolButton>
            </Tooltip>
        </TabPanelButtons>
    );
};

interface SqlEditorLabelProps {
    session: IDatabaseSession;
    tabsItemID?: string;
    itemID?: string;
}

export const SqlEditorLabel: React.FC<SqlEditorLabelProps> = (props) => {
    const { session, itemID, tabsItemID } = props;
    const theme = useTheme();
    const [label, setLabel] = React.useState<string>("SQL Editor");
    const { tabIsActive, tabsCount } = useTabs(tabsItemID, itemID);
    const { subscribe, unsubscribe, queueMessage } = useMessages();

    React.useEffect(() => {
        const handleFirstLineChanged = (data: { isComment: boolean; content: string; itemID?: string }) => {
            if (itemID !== data.itemID) {
                return; // Sprawdź, czy itemID się zgadza
            }

            if (data.isComment) {
                setLabel(data.content);
            } else {
                setLabel("SQL Editor");
            }
        };

        subscribe(SQL_EDITOR_FIRST_LINE_CHANGED, handleFirstLineChanged);
        return () => {
            unsubscribe(SQL_EDITOR_FIRST_LINE_CHANGED, handleFirstLineChanged);
        };
    }, [tabsItemID, itemID]);

    return (
        <TabPanelLabel>
            <theme.icons.SqlEditor />
            <span>{label}</span>
            <ToolButton
                component="div"
                color="main"
                onClick={() => queueMessage(SQL_EDITOR_CLOSE, itemID)}
                size="small"
                disabled={!tabIsActive || tabsCount <= 1}
                dense
            >
                <theme.icons.Close color={!tabIsActive || tabsCount <= 1 ? undefined : "error"} />
            </ToolButton>
        </TabPanelLabel>
    );
};
