import MonacoEditor, { EditorLanguageId } from "@renderer/components/editor/MonacoEditor";
import React, { useRef, useEffect } from "react";
import * as monaco from "monaco-editor";
import { Monaco } from "@monaco-editor/react";
import { ExecuteQueryAction, ExecuteQueryActionId } from "./editor/actions/ExecuteQueryAction";
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
import { SQL_EDITOR_ADD, SQL_EDITOR_CLOSE, SQL_EDITOR_DELETE, SQL_EDITOR_MENU_REOPEN, SQL_EDITOR_OPEN_FILE, SQL_EDITOR_SAVE_FILE } from "./EdiorsTabs";
import { AddSqlEditorTab } from "./editor/actions/AddSqlEditorTab";
import { CloseSqlEditorTab } from "./editor/actions/CloseSqlEditorTab";
import { MenuReopenSqlEditorTab } from "./editor/actions/MenuReopenSqlEditorTab";
import { DatabaseMetadata } from "src/api/db";
import { ColumnDefinition } from "@renderer/components/DataGrid/DataGridTypes";
import { getFragmentAroundCursor, getNextNeighbor, getPrevNeighbor, getStringTypeAroundCursor, resolveWordAlias } from "@renderer/components/editor/editorUtils";
import { AstComponent, SqlAnalyzer, SqlAstBuilder, SqlTokenizer, Token } from "sql-taaf";
import { MetadataCommandProcessor } from "./MetadataCommandProcessor";
import { useTabs } from "@renderer/components/TabsPanel/useTabs";
import { SQL_RESULT_FOCUS } from "./SqlResultPanel";
import Tooltip from "@renderer/components/Tooltip";
import { ToolButton } from "@renderer/components/buttons/ToolButton";
import { SelectQueryHistoryAction, SelectQueryHistoryActionId } from "./editor/actions/SelectQueryHistoryAction";
import { ProfileRecord } from "src/api/entities";
import QueryHistoryDialog from "@renderer/dialogs/QueryHistoryDialog";
import { OpenFileSqlEditorTab } from "./editor/actions/OpenFileSqlEditorTab";
import { Ellipsis } from "@renderer/components/useful/Elipsis";
import { SaveEditorTabAsFile } from "./editor/actions/SaveEditorTabAsFile";
import { extractSqlParameters } from "../../../../../api/db/SqlParameters";
import { TabCloseButton } from "@renderer/components/TabsPanel/TabCloseButton";
import { IActionManager } from "@renderer/components/CommandPalette/ActionManager";
import { useTabValue } from "@renderer/components/TabsPanel/TabPanel";
import { CommandManager } from "@renderer/components/CommandPalette/CommandManager";
import ButtonGroup from "@renderer/components/buttons/ButtonGroup";
//import { SqlParser } from "@renderer/components/editor/SqlParser";

export const SQL_EDITOR_EXECUTE_QUERY = "sql-editor:execute-query";
export const SQL_EDITOR_SHOW_STRUCTURE = "sql-editor:show-structure";

export interface SqlEditorExecuteQueryMessage {
    to: string,
    from: string,
    query: string,
}

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
    const [openSelectQueryHistoryDialog, setOpenSelectQueryHistoryDialog] = React.useState(false);
    const [, setTabActionManager] = useTabValue<IActionManager<monaco.editor.ICodeEditor> | undefined>(itemID!, "actionManager");
    const [, setTabEditor] = useTabValue<monaco.editor.IStandaloneCodeEditor | undefined>(itemID!, "editor");

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

    const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, _monaco: Monaco, actionManager: IActionManager<monaco.editor.ICodeEditor>) => {
        setEditorInstance(editor); // Ustaw editor w stanie
        setTabActionManager(actionManager); // Ustaw action manager dla tego taba
        setTabEditor(editor); // Ustaw instancję edytora dla tego taba

        // Dodanie polecenia do listy poleceń edytora
        actionManager.registerAction(ExecuteQueryAction((query: string) => {
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

            console.log(extractSqlParameters(query));

            queueMessage(SQL_EDITOR_EXECUTE_QUERY, {
                to: session.info.uniqueId,
                from: itemID,
                query: query,
            } as SqlEditorExecuteQueryMessage);
        }));
        editor.addAction(SelectCurrentCommand());
        editor.addAction(AddSqlEditorTab(() => { queueMessage(SQL_EDITOR_ADD, { tabsItemID }); }));
        editor.addAction(OpenFileSqlEditorTab(() => { queueMessage(SQL_EDITOR_OPEN_FILE, { tabsItemID }); }));
        editor.addAction(SaveEditorTabAsFile(() => { queueMessage(SQL_EDITOR_SAVE_FILE, { tabsItemID, editorId: itemID }); }));
        editor.addAction(CloseSqlEditorTab(() => { queueMessage(SQL_EDITOR_CLOSE, itemID); }));
        editor.addAction(MenuReopenSqlEditorTab(() => { queueMessage(SQL_EDITOR_MENU_REOPEN, { tabsItemID }); }));
        actionManager.registerAction(SelectQueryHistoryAction(() => setOpenSelectQueryHistoryDialog(true)));

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
        <>
            <MonacoEditor
                onMount={handleEditorDidMount}
                language={editorContentManager.getLanguage(itemID!) || "sql"}
                encoding={editorContentManager.getEncoding(itemID!) || "UTF-8"}
                eol={editorContentManager.getEol(itemID!) || "LF"}
                onLanguageChange={language => editorContentManager.setLanguage(itemID!, language)}
                onEncodingChange={encoding => editorContentManager.setEncoding(itemID!, encoding)}
                onEolChange={eol => editorContentManager.setEol(itemID!, eol)}
                onFocus={editorContentManager.setActive.bind(editorContentManager, itemID!)}
            />
            {openSelectQueryHistoryDialog && (
                <QueryHistoryDialog
                    open={true}
                    onClose={(result) => {
                        setOpenSelectQueryHistoryDialog(false);
                        if (result && editorInstance) {
                            const selection = editorInstance.getSelection();
                            if (selection && !selection.isEmpty()) {
                                editorInstance.executeEdits("select-query-history", [
                                    {
                                        range: selection,
                                        text: result.query,
                                    },
                                ]);
                            } else {
                                const position = editorInstance.getPosition();
                                if (position) {
                                    editorInstance.executeEdits("select-query-history", [
                                        {
                                            range: new monaco.Range(
                                                position.lineNumber,
                                                position.column,
                                                position.lineNumber,
                                                position.column
                                            ),
                                            text: result.query,
                                        },
                                    ]);
                                }
                            }
                        }
                    }}
                    profileName={(session.getUserData("profile") as ProfileRecord).sch_name}
                />
            )}
        </>
    );
};

interface SqlEditorButtonsProps {
    session: IDatabaseSession,
    editorContentManager: EditorContentManager,
    itemID?: string,
}

export const SqlEditorButtons: React.FC<SqlEditorButtonsProps> = (props) => {
    const { session, editorContentManager, itemID } = props;
    const { t } = useTranslation();
    const theme = useTheme();
    const dialogs = useDialogs();
    const { queueMessage } = useMessages();
    const [tabActionManager] = useTabValue<IActionManager<monaco.editor.ICodeEditor> | undefined>(itemID!, "actionManager");
    const [tabEditor] = useTabValue<monaco.editor.IStandaloneCodeEditor | undefined>(itemID!, "editor");

    const handleDeleteSqlEditor = () => {
        if (itemID) {
            const tDeleteFile = t("delete-sql-editor-tab-confirm", "Are you sure you want to delete this SQL Editor tab?");
            const tUndone = t("this-action-cannot-be-undone", "This action cannot be undone and content will be permanently deleted.");
            const tUndeoneExternal = t("this-action-cannot-be-undone-external", "This action cannot be undone but the file will remain on disk.");

            const state = editorContentManager.getState(itemID);
            const isExternalFile = state?.externalPath ? true : false;

            dialogs.confirm(
                tDeleteFile + "\n" + (isExternalFile ? tUndeoneExternal : tUndone),
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
            <ButtonGroup>
                <ToolButton
                    action={ExecuteQueryActionId}
                    actionManager={tabActionManager}
                    actionContext={() => tabEditor!}
                    size="small"
                />
                {/* <ToolButton
                    action={SelectQueryHistoryActionId}
                    actionManager={tabActionManager}
                    actionContext={() => tabEditor!}
                    size="small"
                /> */}
            </ButtonGroup>
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
    editorContentManager: EditorContentManager;
    itemID?: string;
}

export const SqlEditorLabel: React.FC<SqlEditorLabelProps> = (props) => {
    const { session, editorContentManager, itemID, tabsItemID } = props;
    const theme = useTheme();
    const [label, setLabel] = React.useState<string | null>(editorContentManager.getLabel(itemID!));
    const [fileLabel, setFileLabel] = React.useState<string | null>(null);
    const [language, setLanguage] = React.useState<EditorLanguageId | null>(editorContentManager.getLanguage(itemID!) || "sql");
    const [saved, setSaved] = React.useState<boolean>(true);
    const { tabIsActive, tabsCount } = useTabs(tabsItemID, itemID);
    const { subscribe, unsubscribe, queueMessage } = useMessages();

    React.useEffect(() => {
        if (itemID) {
            const state = editorContentManager.getState(itemID);
            if (state?.externalPath) {
                const fileLabel = state.fileName.split(".").slice(0, -1).join(".");
                setFileLabel(fileLabel);
            }
        }
    }, [itemID, editorContentManager]);

    React.useEffect(() => {
        const offChangeLabel = editorContentManager.onStateChange(itemID!, "label", (newLabel: string | null) => {
            setLabel(newLabel ?? fileLabel ?? "SQL Editor")
        });
        const offChageFileName = editorContentManager.onStateChange(itemID!, "fileName", (newFileName: string | null) => {
            if (newFileName) {
                const fileLabel = newFileName.split(".").slice(0, -1).join(".");
                setFileLabel(fileLabel);
            }
        });
        const offChangeLanguage = editorContentManager.onStateChange(itemID!, "language", (newLanguage: EditorLanguageId) => {
            setLanguage(newLanguage);
        });
        const offChangeSaved = editorContentManager.onStateChange(itemID!, "saved", (newSaved: boolean) => {
            setSaved(newSaved);
        });

        return () => {
            offChangeLabel();
            offChageFileName();
            offChangeLanguage();
            offChangeSaved();
        };
    }, [tabsItemID, itemID, fileLabel, editorContentManager]);

    let Icon = theme.icons.File;
    switch (language) {
        case "json": Icon = theme.icons.JsonEditor; break;
        case "sql": Icon = theme.icons.SqlEditor; break;
        case "html": Icon = theme.icons.HtmlEditor; break;
        case "css": Icon = theme.icons.CssEditor; break;
        case "javascript": Icon = theme.icons.JsEditor; break;
        case "xml": Icon = theme.icons.XmlEditor; break;
        case "markdown": Icon = theme.icons.MarkdownEditor; break;
    }

    return (
        <TabPanelLabel>
            <Icon color={saved !== undefined && !saved ? "warning" : undefined} />
            <div style={{ display: "flex", maxWidth: 300 }}>
                <Ellipsis blured={false}>{label ?? fileLabel ?? "SQL Editor"}</Ellipsis>
            </div>
            <TabCloseButton
                onClick={() => queueMessage(SQL_EDITOR_CLOSE, itemID)}
                active={tabIsActive && tabsCount > 1}
            />
        </TabPanelLabel>
    );
};
