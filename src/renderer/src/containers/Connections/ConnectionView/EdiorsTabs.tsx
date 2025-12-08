import React, { useEffect, useMemo, useState } from "react";
import { Stack, styled, useTheme, Menu, MenuItem, Divider } from "@mui/material";
import { SqlEditorButtons, SqlEditorContent, SqlEditorLabel } from "./SqlEditorPanel";
import TabsPanel from "@renderer/components/TabsPanel/TabsPanel";
import TabPanel, { TabPanelOwnProps } from "@renderer/components/TabsPanel/TabPanel";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { useTranslation } from "react-i18next";
import { uuidv7 } from "uuidv7";
import EditorContentManager, { EditorState } from "@renderer/contexts/EditorContentManager";
import { DateTime } from "luxon";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { vs, vs2015 } from "react-syntax-highlighter/dist/esm/styles/hljs"; // Możesz wybrać inny styl
import { useMessages } from "@renderer/contexts/MessageContext";
import { SWITCH_PANEL_TAB } from "@renderer/app/Messages";
import Tooltip from "@renderer/components/Tooltip";
import { ToolButton } from "@renderer/components/buttons/ToolButton";
import ButtonGroup from "@renderer/components/buttons/ButtonGroup";
import { editorExtLanguages } from "@renderer/contexts/EditorContentManager";

export const SQL_EDITOR_DELETE = "sql-editor:delete";
export const SQL_EDITOR_CLOSE = "sql-editor:close";
export const SQL_EDITOR_ADD = "sql-editor:new";
export const SQL_EDITOR_MENU_REOPEN = "sql-editor:menu-reopen";
export const SQL_EDITOR_OPEN_FILE = "sql-editor:open-file";
export const SQL_EDITOR_SAVE_FILE = "sql-editor:save-file";

export interface SqlEditorAddMessage {
    tabsItemID: string;
    editorId?: string;
    externalFile?: string;
}

const StyledEditorsTabs = styled(Stack, {
    name: "EditorsTabs",
    slot: "root",
})(({ /*theme*/ }) => ({
    height: "100%",
    width: "100%",
}));

interface EditorsTabsProps extends React.ComponentProps<typeof Stack> {
}

interface EditorsTabsOwnProps extends EditorsTabsProps {
    session: IDatabaseSession;
    editorContentManager: EditorContentManager; // Dodano EditorContentManager jako prop
    additionalTabs?: React.ReactElement<TabPanelOwnProps>[];
}

export function editorsTabsId(session: IDatabaseSession): string {
    return session.profile.sch_id + ":" + session.info.uniqueId + "sql-editors";
}

export const EditorsTabs: React.FC<EditorsTabsOwnProps> = (props) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const { session, editorContentManager, additionalTabs, ...other } = props;
    const [editorsTabs, setEditorsTabs] = useState<React.ReactElement<TabPanelOwnProps>[]>([]);
    const tabsItemID = useMemo(() => editorsTabsId(session), [session]);
    const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
    const [closedEditors, setClosedEditors] = useState<EditorState[]>([]);
    const { subscribe, unsubscribe, queueMessage } = useMessages();

    const fileFilters = useMemo(() => {
        const filters = Object.entries(editorExtLanguages)
            .filter(([_, exts]) => Array.isArray(exts) && exts.length > 0)
            .map(([lang, exts]) => ({
                name: t("{{type}} Files", { type: lang.charAt(0).toUpperCase() + lang.slice(1) }),
                extensions: exts as string[],
            }));

        filters.push({ name: t("all-files", "All Files"), extensions: ["*"] });
        return filters;
    }, [t]);

    useEffect(() => {
        const initializeTabs = async () => {
            const editorStates = await editorContentManager.getStates();
            const openEditors = editorStates.filter((state) => state.open);

            if (openEditors.length === 0 && editorStates.length > 0) {
                openEditors.push(editorStates[0]); // Dodaj pierwszy edytor, jeśli nie ma otwartych
            }

            if (openEditors.length > 0) {
                const tabs = openEditors.map((editor) => {
                    if (!editor.open) {
                        editorContentManager.setOpen(editor.editorId, true);
                    }
                    return (
                        <TabPanel
                            key={editor.editorId}
                            itemID={editor.editorId}
                            label={<SqlEditorLabel session={session} editorContentManager={editorContentManager} />}
                            content={<SqlEditorContent session={session} editorContentManager={editorContentManager} />}
                            buttons={<SqlEditorButtons session={session} editorContentManager={editorContentManager} />}
                        />);
                });
                setEditorsTabs(tabs);
            } else {
                const newEditorId = uuidv7();
                setEditorsTabs([
                    <TabPanel
                        key={newEditorId}
                        itemID={newEditorId}
                        label={<SqlEditorLabel session={session} editorContentManager={editorContentManager} />}
                        content={<SqlEditorContent session={session} editorContentManager={editorContentManager} />}
                        buttons={<SqlEditorButtons session={session} editorContentManager={editorContentManager} />}
                    />,
                ]);
                editorContentManager.addEditor(newEditorId);
            }
        };

        initializeTabs();
    }, [editorContentManager, session]);

    useEffect(() => {
        const handleCloseSqlEditor = (itemID: string) => {
            const exists = editorsTabs.some(
                (tab) => React.isValidElement(tab) && tab.props.itemID === itemID
            );
            if (!exists) return; // Jeśli itemID nie istnieje, zakończ funkcję

            editorContentManager.setOpen(itemID, false);
            setEditorsTabs((prevTabs) =>
                prevTabs.filter(
                    (tab) =>
                        React.isValidElement(tab) &&
                        tab.props.itemID !== itemID
                )
            );
        };

        const handleDeleteSqlEditor = (itemID: string) => {
            const exists = editorsTabs.some(
                (tab) => React.isValidElement(tab) && tab.props.itemID === itemID
            );
            if (!exists) return; // Jeśli itemID nie istnieje, zakończ funkcję

            editorContentManager.remove(itemID).catch((error) => {
                console.error("Error removing editor:", error); // Debugging
            });

            setEditorsTabs((prevTabs) =>
                prevTabs.filter(
                    (tab) =>
                        React.isValidElement(tab) &&
                        tab.props.itemID !== itemID
                )
            );
        };

        const handleAddSqlEditor = async (message: SqlEditorAddMessage) => {
            if (message.tabsItemID !== tabsItemID) return;

            const newEditorId = message.editorId || uuidv7();
            const newEditor = (
                <TabPanel
                    key={newEditorId}
                    itemID={newEditorId}
                    label={<SqlEditorLabel session={session} editorContentManager={editorContentManager} />}
                    content={<SqlEditorContent session={session} editorContentManager={editorContentManager} />}
                    buttons={<SqlEditorButtons session={session} editorContentManager={editorContentManager} />}
                />
            );
            if (!message.editorId) {
                await editorContentManager.addEditor(newEditorId, undefined, message.externalFile);
            }
            else {
                editorContentManager.setOpen(newEditorId, true);
            }
            setEditorsTabs((prevTabs) => [...prevTabs, newEditor]);
            requestAnimationFrame(() => {
                queueMessage(SWITCH_PANEL_TAB, tabsItemID, newEditorId);
            });
        };

        const handleMenuReopenSqlEditor = async (message: { tabsItemID: string }) => {
            if (message.tabsItemID !== tabsItemID) return;

            if (menuButtonRef.current) {
                setMenuAnchor(menuButtonRef.current); // Ustawienie referencji jako anchor
            }

            // Pobierz listę nieotwartych edytorów w momencie otwierania menu
            const editorStates = await editorContentManager.getStates();
            const closed = editorStates.filter((state) => !state.open);
            setClosedEditors(closed);
        };

        const handleOpenFile = async (message: { tabsItemID: string }) => {
            if (message.tabsItemID !== tabsItemID) return;

            const result = await window.electron.dialog.showOpenDialog({
                title: t("open-file", "Open File"),
                properties: ["openFile"],
                filters: fileFilters,
            });
            if (result.canceled || result.filePaths.length === 0) {
                return;
            }
            queueMessage(SQL_EDITOR_ADD, { tabsItemID, externalFile: result.filePaths[0] } as SqlEditorAddMessage);
        };

        const handleSaveFile = async (message: { tabsItemID: string; editorId: string }) => {
            if (message.tabsItemID !== tabsItemID) return;

            const state = editorContentManager.getState(message.editorId);
            if (!state) {
                console.error("Editor state not found for ID:", message.editorId);
                return;
            }

            const result = await window.electron.dialog.showSaveDialog({
                title: t("save-file", "Save File"),
                defaultPath: state.label ?? (state.externalPath ? state.fileName : undefined) ?? "untitled.sql",
                filters: fileFilters,
            });

            if (result.canceled) {
                return;
            }

            await editorContentManager.setExternalFile(message.editorId, result.filePath);
        };

        subscribe(SQL_EDITOR_DELETE, handleDeleteSqlEditor);
        subscribe(SQL_EDITOR_CLOSE, handleCloseSqlEditor);
        subscribe(SQL_EDITOR_ADD, handleAddSqlEditor);
        subscribe(SQL_EDITOR_MENU_REOPEN, handleMenuReopenSqlEditor);
        subscribe(SQL_EDITOR_OPEN_FILE, handleOpenFile);
        subscribe(SQL_EDITOR_SAVE_FILE, handleSaveFile);
        return () => {
            unsubscribe(SQL_EDITOR_DELETE, handleDeleteSqlEditor);
            unsubscribe(SQL_EDITOR_CLOSE, handleCloseSqlEditor);
            unsubscribe(SQL_EDITOR_ADD, handleAddSqlEditor);
            unsubscribe(SQL_EDITOR_MENU_REOPEN, handleMenuReopenSqlEditor);
            unsubscribe(SQL_EDITOR_OPEN_FILE, handleOpenFile);
            unsubscribe(SQL_EDITOR_SAVE_FILE, handleSaveFile);
        };
    }, [editorContentManager, editorsTabs, session, fileFilters]);

    const menuButtonRef = React.useRef<HTMLButtonElement | null>(null); // Dodanie referencji

    const handleMenuClose = () => {
        setMenuAnchor(null);
    };

    const handleSelectEditor = (editorId: string) => {
        queueMessage(SQL_EDITOR_ADD, { tabsItemID, editorId } as SqlEditorAddMessage);
        handleMenuClose();
    };

    const handleOpenFile = async () => {
        queueMessage(SQL_EDITOR_OPEN_FILE, { tabsItemID });
        handleMenuClose();
    };

    // Lokalny renderer dla przycisku dodawania SQL edytora
    const renderSqlEditorButtons = () => {
        return (
            <TabPanelButtons>
                <ButtonGroup>
                    <Tooltip title={t("add-sql-editor-tab", "Add SQL Editor Tab")}>
                        <ToolButton
                            onClick={() => queueMessage(SQL_EDITOR_ADD, { tabsItemID } as SqlEditorAddMessage)}
                            size="small"
                            color="main"
                        >
                            <theme.icons.AddTab color="success" />
                        </ToolButton>
                    </Tooltip>
                    <Tooltip title={t("open-closed-editors", "Open closed editors")}>
                        <ToolButton
                            ref={menuButtonRef} // Przypisanie referencji do ToolButton
                            color="main"
                            onClick={() => queueMessage(SQL_EDITOR_MENU_REOPEN, { tabsItemID })}
                            size="small"
                        >
                            <theme.icons.ExpandMore color="primary" />
                        </ToolButton>
                    </Tooltip>
                    <Menu
                        anchorEl={menuAnchor}
                        open={Boolean(menuAnchor)}
                        onClose={handleMenuClose}
                    >
                        {closedEditors.length > 0 ? (
                            closedEditors.map((state) => (
                                <Tooltip
                                    key={state.editorId}
                                    interactive
                                    title={
                                        state.sampleLines && state.sampleLines.trim() !== "" ? ( // Sprawdź, czy sampleLines nie jest puste
                                            <>
                                                {state.externalPath && (
                                                    <div>
                                                        {state.externalPath}/{state.fileName}
                                                    </div>
                                                )}
                                                <SyntaxHighlighter
                                                    language={state.language || "sql"}
                                                    style={theme.palette.mode === "dark" ? vs2015 : vs}
                                                    customStyle={{
                                                        //maxWidth: "500px",
                                                        width: "auto",
                                                    }}
                                                >
                                                    {"...\n" + state.sampleLines + "\n..."}
                                                </SyntaxHighlighter>
                                            </>
                                        ) : ""
                                    }
                                    placement="right"
                                    slotProps={{
                                        tooltip: {
                                            sx: {
                                                maxWidth: "600px",
                                                width: "auto",
                                            },
                                        },
                                    }}
                                >
                                    <MenuItem
                                        key={state.editorId}
                                        onClick={() => handleSelectEditor(state.editorId)}
                                    >
                                        {state.externalPath && <theme.icons.File />}
                                        {[
                                            state.externalPath && !state.label && (state.fileName.length > 25 ? state.fileName.slice(0, 22) + "..." : state.fileName),
                                            state.label,
                                            t("Lines", "Lines {{count}}", { count: state.lines || 0 }),
                                            t("cursor-position", "Ln {{line}}, Col {{column}}", { line: state.position?.line || 0, column: state.position?.column || 0 }),
                                            t("last-modified", "{{date}}", { date: DateTime.fromMillis(state.lastModified).toSQL() }),
                                        ].filter(Boolean).join(" - ")}
                                    </MenuItem>
                                </Tooltip>
                            ))
                        ) : (
                            <MenuItem disabled>{t("no-closed-editors", "No closed editors available")}</MenuItem>
                        )}
                        <Divider />
                        <MenuItem onClick={handleOpenFile}>
                            {t("open-file", "Open file...")}
                        </MenuItem>
                    </Menu>
                </ButtonGroup>
            </TabPanelButtons >
        );
    };

    return (
        <StyledEditorsTabs className="EditorsTabs-root" {...other}>
            <TabsPanel
                itemID={tabsItemID}
                className="editors-tabs"
                buttons={renderSqlEditorButtons()}
            >
                {editorsTabs}
                {additionalTabs}
            </TabsPanel>
        </StyledEditorsTabs>
    );
};
