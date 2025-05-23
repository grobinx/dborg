import MonacoEditor from "@renderer/components/editor/MonacoEditor";
import React, { useRef, useEffect } from "react";
import * as monaco from "monaco-editor";
import { Monaco } from "@monaco-editor/react";
import { ExecuteQueryAction } from "./editor/actions/ExecuteQueryAction";
import { useTranslation } from "react-i18next";
import { UseListenersType } from "@renderer/hooks/useListeners";
import { Tooltip, useTheme } from "@mui/material";
import ToolButton from "@renderer/components/ToolButton";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import EditorContentManager from "@renderer/contexts/EditorContentManager";
import { useNotification } from "@renderer/contexts/NotificationContext";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { useDialogs } from "@toolpad/core";
import { SelectCurrentCommand } from "./editor/actions/SelectCurrentCommand";
import { Messages, useMessages } from "@renderer/contexts/MessageContext";
import { TAB_PANEL_CLICK, TAB_PANEL_LENGTH, TabPanelChangedMessage, TabPanelClickMessage, TabPanelLengthMessage } from "@renderer/app/Messages";
import { SQL_EDITOR_ADD, SQL_EDITOR_CLOSE, SQL_EDITOR_DELETE, SQL_EDITOR_MENU_REOPEN } from "./EdiorsTabs";
import { AddSqlEditorTab } from "./editor/actions/AddSqlEditorTab";
import { CloseSqlEditorTab } from "./editor/actions/CloseSqlEditorTab";
import { MenuReopenSqlEditorTab } from "./editor/actions/MenuReopenSqlEditorTab";
import { DatabaseMetadata, DatabasesMetadata } from "src/api/db";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { analyzeQueryFragment, getFragmentAroundCursor, getNextNeighbor, getPrevNeighbor, getStringTypeAroundCursor, resolveWordAlias } from "@renderer/components/editor/editorUtils";
import { AstComponent, SqlAnalyzer, SqlAstBuilder, SqlTokenizer, Token } from "sql-taaf";
//import { SqlParser } from "@renderer/components/editor/SqlParser";

export const SQL_EDITOR_FIRST_LINE_CHANGED = "sql-editor:first-line-changed";
export const SQL_EDITOR_EXECUTE_QUERY = "sql-editor:execute-query";
export const SQL_EDITOR_SHOW_STRUCTURE = "sql-editor:show-structure";

interface SqlEditorContentProps {
    session: IDatabaseSession;
    tabsItemID?: string;
    itemID?: string;
    editorContentManager: EditorContentManager; // Dodano EditorContentManager jako prop
}

export const SqlEditorContent: React.FC<SqlEditorContentProps> = (props) => {
    const { session, tabsItemID, itemID, editorContentManager } = props;
    const { addNotification } = useNotification();
    const { t } = useTranslation();
    const firstLineRef = useRef<string>("");
    const contentLoadedRef = useRef(false);
    const [editorInstance, setEditorInstance] = React.useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const updateCursorPositionRef = useRef<() => void>(() => { }); // Referencja na funkcję
    const updateEditorContentRef = useRef<() => void>(() => { }); // Referencja na funkcję
    const { subscribe, unsubscribe, sendMessage } = useMessages();
    const databaseMetadataRef = React.useRef<DatabaseMetadata | null>(null);
    const hoverProviderRef = useRef<monaco.IDisposable | null>(null);
    const editorFocusedRef = useRef(false);
    const currentFragmentRef = useRef<string | null>(null);
    const currentSqlAstRef = useRef<AstComponent[] | null>(null);

    useEffect(() => {
        const handleTabPanelClick = (message: TabPanelClickMessage) => {
            if (message.itemID === itemID && editorInstance) {
                editorInstance.focus();
            }
        }
        // Subskrybuj zdarzenie kliknięcia w zakładkę
        subscribe(TAB_PANEL_CLICK, handleTabPanelClick);
        return () => {
            unsubscribe(TAB_PANEL_CLICK, handleTabPanelClick);
        };
    }, [itemID, editorInstance]);

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

        subscribe(Messages.SESSION_GET_METADATA_SUCCESS, metadataSuccessHandler);
        return () => {
            unsubscribe(Messages.SESSION_GET_METADATA_SUCCESS, metadataSuccessHandler);
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

        sendMessage(SQL_EDITOR_FIRST_LINE_CHANGED, {
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
                addNotification(
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
            if (!query || query.trim() === "") {
                return;
            }
            const analysisResult = analyzeQueryFragment(query);
            if (analysisResult.type === undefined) {
                sendMessage(SQL_EDITOR_EXECUTE_QUERY, {
                    to: session.info.uniqueId,
                    from: itemID,
                    query: query,
                });
            }
            else if (databaseMetadataRef.current) {
                const { type, schema, object } = analysisResult;
                if (type === "relation or schema") {
                    if (databaseMetadataRef.current.schemas[object]) {
                        const tables = Object.values(databaseMetadataRef.current.schemas[object].relations).map((relation) => ({
                            name: relation.name,
                            type: relation.type,
                            kind: relation.kind,
                            description: relation.description,
                            owner: relation.owner,
                            select: relation.permissions?.select,
                            insert: relation.permissions?.insert,
                            update: relation.permissions?.update,
                            delete: relation.permissions?.delete,
                            columns: relation.columns.length,
                        }));
                        sendMessage(SQL_EDITOR_SHOW_STRUCTURE, {
                            to: session.info.uniqueId,
                            from: itemID,
                            data: tables,
                            columns: [
                                { key: "name", label: t("relation-name", "Relation name"), dataType: "string" },
                                { key: "type", label: t("type", "Type"), dataType: "string" },
                                { key: "kind", label: t("kind", "Kind"), dataType: "string" },
                                { key: "description", label: t("description", "Description"), dataType: "string" },
                                { key: "owner", label: t("owner", "Owner"), dataType: "string" },
                                { key: "select", label: t("can-select", "Select"), dataType: "boolean" },
                                { key: "insert", label: t("can-insert", "Insert"), dataType: "boolean" },
                                { key: "update", label: t("can-update", "Update"), dataType: "boolean" },
                                { key: "delete", label: t("can-delete", "Delete"), dataType: "boolean" },
                                { key: "columns", label: t("columns", "Columns"), dataType: "number" },
                            ] as ColumnDefinition[],
                        });
                    }
                    else {

                    }
                }
            }
        }));
        editor.addAction(SelectCurrentCommand(t));
        editor.addAction(AddSqlEditorTab(t, () => { sendMessage(SQL_EDITOR_ADD, { tabsItemID }); }));
        editor.addAction(CloseSqlEditorTab(t, () => { sendMessage(SQL_EDITOR_CLOSE, itemID); }));
        editor.addAction(MenuReopenSqlEditorTab(t, () => { sendMessage(SQL_EDITOR_MENU_REOPEN, { tabsItemID }); }));

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
    const { sendMessage } = useMessages();

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
                    sendMessage(SQL_EDITOR_DELETE, itemID);
                }
            });
        }
    }

    return (
        <TabPanelButtons>
            <Tooltip title={t("delete-sql-editor-tab", "Delete SQL Editor tab")}>
                <span>
                    <ToolButton
                        color="error"
                        onClick={handleDeleteSqlEditor}
                    >
                        <theme.icons.Delete />
                    </ToolButton>
                </span>
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
    const [tabsLength, setTabsLength] = React.useState<number | null>(null); // Domyślnie 1 zakładka
    const [active, setActive] = React.useState(false);
    const { subscribe, unsubscribe, sendMessage } = useMessages();

    React.useEffect(() => {
        const handleTabPanelChangedMessage = (message: TabPanelChangedMessage) => {
            if (tabsItemID === message.tabsItemID) {
                const newActive = message.itemID === itemID;
                if (newActive !== active) {
                    setActive(newActive);
                }
            }
        };

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

        const handleTabsLengthChange = (message: TabPanelLengthMessage) => {
            if (tabsItemID !== message.tabsItemID) {
                return; // Sprawdź, czy tabsItemID się zgadza
            }
            setTabsLength(message.length);
        };

        subscribe(Messages.TAB_PANEL_CHANGED, handleTabPanelChangedMessage);
        subscribe(SQL_EDITOR_FIRST_LINE_CHANGED, handleFirstLineChanged);
        subscribe(TAB_PANEL_LENGTH, handleTabsLengthChange);
        return () => {
            unsubscribe(Messages.TAB_PANEL_CHANGED, handleTabPanelChangedMessage);
            unsubscribe(SQL_EDITOR_FIRST_LINE_CHANGED, handleFirstLineChanged);
            unsubscribe(TAB_PANEL_LENGTH, handleTabsLengthChange);
        };
    }, [tabsItemID, itemID, active]);

    return (
        <TabPanelLabel>
            <theme.icons.SqlEditor />
            <span>{label}</span>
            <ToolButton
                color="error"
                onClick={() => sendMessage(SQL_EDITOR_CLOSE, itemID)}
                size="small"
                disabled={!active || (tabsLength ?? 0) <= 1}
            >
                <theme.icons.Close />
            </ToolButton>
        </TabPanelLabel>
    );
};
