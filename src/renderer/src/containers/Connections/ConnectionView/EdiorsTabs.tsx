import React, { useEffect, useMemo, useState } from "react";
import { Stack, styled, useTheme, Menu, MenuItem } from "@mui/material";
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

export const SQL_EDITOR_DELETE = "sql-editor:delete";
export const SQL_EDITOR_CLOSE = "sql-editor:close";
export const SQL_EDITOR_ADD = "sql-editor:new";
export const SQL_EDITOR_MENU_REOPEN = "sql-editor:menu-reopen";

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
    return session.schema.sch_id + ":" + session.info.uniqueId + "sql-editors";
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
                            label={<SqlEditorLabel session={session} />}
                            content={
                                <SqlEditorContent
                                    session={session}
                                    editorContentManager={editorContentManager}
                                />
                            }
                            buttons={<SqlEditorButtons session={session} />}
                        />);
                });
                setEditorsTabs(tabs);
            } else {
                const newEditorId = uuidv7();
                setEditorsTabs([
                    <TabPanel
                        key={newEditorId}
                        itemID={newEditorId}
                        label={<SqlEditorLabel session={session} />}
                        content={
                            <SqlEditorContent
                                session={session}
                                editorContentManager={editorContentManager}
                            />
                        }
                        buttons={<SqlEditorButtons session={session} />}
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

        const handleAddSqlEditor = async (message: { tabsItemID: string, editorId?: string }) => {
            if (message.tabsItemID !== tabsItemID) return;

            const newEditorId = message.editorId || uuidv7();
            const newEditor = (
                <TabPanel
                    key={newEditorId}
                    itemID={newEditorId}
                    label={<SqlEditorLabel session={session} />}
                    content={<SqlEditorContent
                        session={session}
                        editorContentManager={editorContentManager}
                    />}
                    buttons={<SqlEditorButtons session={session} />}
                />
            );
            if (!message.editorId) {
                await editorContentManager.addEditor(newEditorId);
            }
            else {
                editorContentManager.setOpen(newEditorId, true);
            }
            setEditorsTabs((prevTabs) => [...prevTabs, newEditor]);
            queueMessage(SWITCH_PANEL_TAB, tabsItemID, newEditorId);
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

        subscribe(SQL_EDITOR_DELETE, handleDeleteSqlEditor);
        subscribe(SQL_EDITOR_CLOSE, handleCloseSqlEditor);
        subscribe(SQL_EDITOR_ADD, handleAddSqlEditor);
        subscribe(SQL_EDITOR_MENU_REOPEN, handleMenuReopenSqlEditor);
        return () => {
            unsubscribe(SQL_EDITOR_DELETE, handleDeleteSqlEditor);
            unsubscribe(SQL_EDITOR_CLOSE, handleCloseSqlEditor);
            unsubscribe(SQL_EDITOR_ADD, handleAddSqlEditor);
            unsubscribe(SQL_EDITOR_MENU_REOPEN, handleMenuReopenSqlEditor);
        };
    }, [editorContentManager, editorsTabs, session]);

    const menuButtonRef = React.useRef<HTMLButtonElement | null>(null); // Dodanie referencji

    const handleMenuClose = () => {
        setMenuAnchor(null);
    };

    const handleSelectEditor = (editorId: string) => {
        queueMessage(SQL_EDITOR_ADD, { tabsItemID, editorId });
        handleMenuClose();
    };

    // Lokalny renderer dla przycisku dodawania SQL edytora
    const renderSqlEditorButtons = () => {
        return (
            <TabPanelButtons>
                <ButtonGroup>
                    <Tooltip title={t("add-sql-editor-tab", "Add SQL Editor Tab")}>
                        <ToolButton
                            onClick={() => queueMessage(SQL_EDITOR_ADD, { tabsItemID })}
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
                                    title={
                                        state.sampleLines && state.sampleLines.trim() !== "" ? ( // Sprawdź, czy sampleLines nie jest puste
                                            <SyntaxHighlighter
                                                language="sql"
                                                style={theme.palette.mode === "dark" ? vs2015 : vs}
                                                customStyle={{
                                                    maxWidth: "500px",
                                                    width: "auto",
                                                }}
                                            >
                                                {"...\n" + state.sampleLines + "\n..."}
                                            </SyntaxHighlighter>
                                        ) : "" // Jeśli sampleLines jest puste, nie pokazuj nic
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
                                        {state.label ? state.label : "-"}
                                        {", " + t("Lines", "Lines {{count}}", { count: state.lines || 0 })}
                                        {", " + t("cursor-position", "Ln {{line}}, Col {{column}}", { line: state.position?.line || 0, column: state.position?.column || 0 })}
                                        {", " + t("last-modified", "{{date}}", { date: DateTime.fromMillis(state.lastModified).toSQL() })}
                                    </MenuItem>
                                </Tooltip>
                            ))
                        ) : (
                            <MenuItem disabled>{t("no-closed-editors", "No closed editors available")}</MenuItem>
                        )}
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
