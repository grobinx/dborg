import React, { useEffect } from "react";
import { Stack, styled, useTheme, Box } from "@mui/material"; // Importuj Badge z Material-UI
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { useTranslation } from "react-i18next";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { Messages, useMessages } from "@renderer/contexts/MessageContext";
import { EditorsTabs, editorsTabsId } from "./ConnectionView/EdiorsTabs";
import { SplitPanel, SplitPanelGroup, Splitter } from "@renderer/components/SplitPanel";
import "./ConnectionStatusBar";
import ResultsTabs, { resultsTabsId } from "./ConnectionView/ResultsTabs";
import { SQL_RESULT_SQL_QUERY_EXECUTING } from "./ConnectionView/SqlResultPanel";
import UnboundBadge from "@renderer/components/UnboundBadge";
import EditorContentManager from "@renderer/contexts/EditorContentManager";
import { useContainers, useSessions, useSessionState } from "@renderer/contexts/ApplicationContext";
import { RefreshSlotFunction, RefreshSlotProvider, useRefreshSlot } from "../ViewSlots/RefreshSlotContext";
import ContentSlot from "../ViewSlots/ContentSlot";
import { ITabSlot, resolveBooleanFactory, resolveContentSlotFactory, resolveContentSlotKindFactory, resolveTabSlotsFactory, resolveToolBarSlotKindFactory } from "../../../../../plugins/manager/renderer/CustomSlots";
import TabPanel from "@renderer/components/TabsPanel/TabPanel";
import { createContentComponent, createTabContent, createTabLabel, createTabPanel } from "../ViewSlots/helpers";
import { RefSlotProvider } from "../ViewSlots/RefSlotContext";
import ToolBarSlot from "../ViewSlots/ToolBarSlot";
import Tooltip from "@renderer/components/Tooltip";
import { ToolButton } from "@renderer/components/buttons/ToolButton";
import { useProfiles } from "@renderer/contexts/ProfilesContext";
import { useSetting } from "@renderer/contexts/SettingsContext";

const StyledConnection = styled(Stack, {
    name: "Connection",
    slot: "root",
})(({ /*theme*/ }) => ({
    // Add styles for the list container if needed
    height: "100%",
}));

export interface ConnectionProps extends React.ComponentProps<typeof Stack> {
}

interface ConnectionsOwnProps extends ConnectionProps {
    session: IDatabaseSession;
    tabsItemID?: string;
}

const ConnectionContentInner: React.FC<ConnectionsOwnProps> = (props) => {
    const { session, children, tabsItemID, ...other } = props;
    const { selectedView } = useSessionState(session.info.uniqueId);
    const { refreshSlot } = useRefreshSlot();
    const { queueMessage } = useMessages();
    const [orientation] = useSetting("dborg", "general.layout.orientation");

    // Utwórz instancję EditorContentManager
    const editorContentManager = React.useMemo(() => new EditorContentManager(session.profile.sch_id), [session.profile.sch_id]);

    // Przechowuj utworzone widoki w stanie
    const [sideViewsMap, setSideViewsMap] = React.useState<Record<string, React.ReactNode>>({});
    const [editorTabsMap, setEditorTabsMap] = React.useState<Record<string, React.ReactElement<React.ComponentProps<typeof TabPanel>>[]>>({});
    const [resultTabsMap, setResultTabsMap] = React.useState<Record<string, React.ReactElement<React.ComponentProps<typeof TabPanel>>[]>>({});
    const [editorPinnedTabsMap, setEditorPinnedTabsMap] = React.useState<React.ReactElement<React.ComponentProps<typeof TabPanel>>[]>([]);
    const [resultPinnedTabsMap, setResultPinnedTabsMap] = React.useState<React.ReactElement<React.ComponentProps<typeof TabPanel>>[]>([]);
    
    const [rootViewsMap, setRootViewsMap] = React.useState<Record<string, React.ReactNode>>({});

    useEffect(() => {
        if (selectedView) {
            if (selectedView.type === "connection" && selectedView.slot) {
                const slot = selectedView.slot;
                if (slot.type === "integrated" && !sideViewsMap[selectedView.id]) {
                    const side = resolveContentSlotFactory(slot.side, refreshSlot);
                    if (side) {
                        setSideViewsMap(prev => ({ ...prev, [selectedView.id]: <ContentSlot key={side.id} slot={side} /> }));
                    }
                    if (slot.editors && slot.editors.length > 0) {
                        const tabs = resolveTabSlotsFactory(slot.editors, refreshSlot);
                        setEditorTabsMap(prev => ({
                            ...prev,
                            [selectedView.id]: createTabPanels(
                                tabs,
                                refreshSlot,
                                selectedView.id,
                                queueMessage,
                                editorsTabsId(session),
                                setEditorTabsMap,
                                setEditorPinnedTabsMap
                            )
                        }));
                    }
                    if (slot.results && slot.results.length > 0) {
                        const tabs = resolveTabSlotsFactory(slot.results, refreshSlot);
                        setResultTabsMap(prev => ({
                            ...prev,
                            [selectedView.id]: createTabPanels(
                                tabs,
                                refreshSlot,
                                selectedView.id,
                                queueMessage,
                                resultsTabsId(session),
                                setResultTabsMap,
                                setResultPinnedTabsMap
                            ),
                        }));
                    }
                } else if (slot.type === "root" && !rootViewsMap[selectedView.id]) {
                    const rootSlot = resolveContentSlotKindFactory(slot.slot, refreshSlot);
                    if (rootSlot) {
                        setRootViewsMap(prev => ({ ...prev, [selectedView.id]: createContentComponent(rootSlot, refreshSlot) }));
                    }
                }
            } else if (selectedView.type === "rendered" && selectedView.render !== null && !sideViewsMap[selectedView.id]) {
                setSideViewsMap(prev => ({ ...prev, [selectedView.id]: <selectedView.render key={selectedView.id} /> }));
            }
        }
    }, [selectedView, session, sideViewsMap, rootViewsMap]);

    console.log("ConnectionContentInner rendering", session.info.uniqueId, selectedView?.id);

    return (
        <StyledConnection className="Connection-root" {...other}>
            {Object.entries(rootViewsMap).map(([id, node]) => (
                <Box key={id} hidden={selectedView?.id !== id} sx={{ height: "100%", width: "100%" }}>
                    {node}
                </Box>
            ))}
            <Box hidden={rootViewsMap[selectedView?.id ?? ""] !== undefined} sx={{ height: "100%", width: "100%" }}>
                <SplitPanelGroup
                    direction="horizontal"
                    autoSaveId={`connection-panel-left-${session.profile.sch_id}`}
                >
                    <SplitPanel defaultSize={20} hidden={!sideViewsMap[selectedView?.id ?? ""]}>
                        {Object.entries(sideViewsMap).map(([id, node]) => (
                            <Box
                                key={id}
                                hidden={selectedView?.id !== id}
                                sx={{
                                    height: "100%",
                                    width: "100%",
                                }}
                            >
                                {node}
                            </Box>
                        ))}
                    </SplitPanel>
                    <Splitter hidden={!sideViewsMap[selectedView?.id ?? ""]} />
                    <SplitPanel>
                        <SplitPanelGroup
                            direction={orientation === "horizontal" ? "vertical" : "horizontal"}
                            autoSaveId={`connection-panel-${session.profile.sch_id}`}
                        >
                            <SplitPanel>
                                <EditorsTabs
                                    session={session}
                                    editorContentManager={editorContentManager}
                                    additionalTabs={[
                                        ...editorPinnedTabsMap,
                                        ...editorTabsMap[selectedView?.id ?? ""] ?? []
                                    ]}
                                />
                            </SplitPanel>
                            <Splitter />
                            <SplitPanel defaultSize={20}>
                                <ResultsTabs
                                    session={session}
                                    additionalTabs={[
                                        ...resultPinnedTabsMap,
                                        ...resultTabsMap[selectedView?.id ?? ""] ?? []
                                    ]}
                                />
                            </SplitPanel>
                        </SplitPanelGroup>
                    </SplitPanel>
                </SplitPanelGroup>
            </Box>
        </StyledConnection>
    );
}

export const ConnectionContent: React.FC<ConnectionsOwnProps> = (props) => {
    return (
        <RefreshSlotProvider>
            <RefSlotProvider>
                <ConnectionContentInner {...props} />
            </RefSlotProvider>
        </RefreshSlotProvider>
    );
};

export const ConnectionButtons: React.FC<{ session: IDatabaseSession }> = ({ session }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const { queueMessage, subscribe, unsubscribe } = useMessages();
    const [gettingMetadata, setGettingMetadata] = React.useState(false);
    const { disconnectSession: disconnectFromDatabase } = useProfiles();

    React.useEffect(() => {
        const metadataStartHandle = (message: Messages.SessionGetMetadataStart) => {
            if (message.connectionId !== session.info.uniqueId) {
                return;
            }
            setGettingMetadata(true);
        };

        const metadataEndHandle = (message: Messages.SessionGetMetadataEnd) => {
            if (message.connectionId !== session.info.uniqueId) {
                return;
            }
            setGettingMetadata(false);
        };

        subscribe(Messages.SESSION_GET_METADATA_START, metadataStartHandle);
        subscribe(Messages.SESSION_GET_METADATA_END, metadataEndHandle);

        return () => {
            unsubscribe(Messages.SESSION_GET_METADATA_START, metadataStartHandle);
            unsubscribe(Messages.SESSION_GET_METADATA_END, metadataEndHandle);
        };
    }, [subscribe, unsubscribe, session]);

    return (
        <TabPanelButtons>
            {session.info.driver.implements.includes("metadata") && (
                < Tooltip title={t("refresh-metadata", "Refresh metadata")}>
                    <ToolButton
                        onClick={() => queueMessage(Messages.REFRESH_METADATA, { connectionId: session.info.uniqueId })}
                        disabled={gettingMetadata}
                        color="main"
                        size="small"
                    >
                        <theme.icons.RefreshMetadata color="primary" />
                    </ToolButton>
                </Tooltip>
            )}
            <Tooltip title={t("disconnect", "Close connection")}>
                <ToolButton
                    onClick={() => disconnectFromDatabase(session.info.uniqueId)}
                    color="main"
                    size="small"
                >
                    <theme.icons.Disconnected />
                </ToolButton>
            </Tooltip>
        </TabPanelButtons >
    );
};

export const ConnectionLabel: React.FC<{ session: IDatabaseSession }> = ({ session }) => {
    const theme = useTheme();
    const [executingFromList, setExecutingFromList] = React.useState<string[]>([]); // Lista message.from
    const { subscribe, unsubscribe } = useMessages();

    React.useEffect(() => {
        const handleQueryExecuting = (message: { to: string; from: string; status: boolean }) => {
            if (message.to !== session.info.uniqueId) {
                return; // Ignoruj wiadomości, które nie są skierowane do tego połączenia
            }

            setExecutingFromList((prevList) => {
                if (message.status) {
                    // Dodaj `from` do listy, jeśli status to true
                    return prevList.includes(message.from) ? prevList : [...prevList, message.from];
                } else {
                    // Usuń `from` z listy, jeśli status to false
                    return prevList.filter((from) => from !== message.from);
                }
            });
        };

        subscribe(SQL_RESULT_SQL_QUERY_EXECUTING, handleQueryExecuting);

        return () => {
            unsubscribe(SQL_RESULT_SQL_QUERY_EXECUTING, handleQueryExecuting);
        };
    }, [session.info.uniqueId]);

    return (
        <TabPanelLabel>
            {executingFromList.length > 0 ? (
                <>
                    <theme.icons.Loading key="icon" />
                    {executingFromList.length > 1 && <UnboundBadge content={executingFromList.length} size="small" />}
                </>
            ) : session.info.connected ? (
                <theme.icons.Connected /> // Wyświetl ikonę Connected, gdy połączenie jest aktywne
            ) : (
                <theme.icons.Disconnected /> // Wyświetl ikonę Disconnected, gdy połączenie jest nieaktywne
            )}
            <span style={{ color: session.profile.sch_color }}>{session.profile.sch_name}</span>
        </TabPanelLabel>
    );
};

function createTabPanels(
    tabs: ITabSlot[] | undefined,
    refreshSlot: RefreshSlotFunction,
    selectedViewId: string,
    queueMessage: (...args: any[]) => void,
    tabsItemID: string,
    setTabsMap: React.Dispatch<React.SetStateAction<Record<string, React.ReactElement<React.ComponentProps<typeof TabPanel>>[]>>>,
    setPinnedTabsMap: React.Dispatch<React.SetStateAction<React.ReactElement<React.ComponentProps<typeof TabPanel>>[]>>,
) {
    if (!tabs) return [];

    return tabs.map((tab, index) => {
        const contentRef = React.createRef<HTMLDivElement>();
        const labelRef = React.createRef<HTMLDivElement>();
        const toolBarRef = React.createRef<HTMLDivElement>();
        const { panel } = createTabPanel(
            tab,
            () => {
                setTabsMap(prevTabs => ({
                    ...prevTabs,
                    [selectedViewId]: prevTabs[selectedViewId].filter(t => t.props.itemID !== tab.id),
                }));
            },
            () => {
                const pinnedTab = tab.pin!();
                if (pinnedTab) {
                    const { panel } = createTabPanel(
                        pinnedTab,
                        () => {
                            setTabsMap(prevTabs => ({
                                ...prevTabs,
                                [selectedViewId]: prevTabs[selectedViewId].filter(t => t.props.itemID !== pinnedTab.id),
                            }));
                            setPinnedTabsMap(prevTabs => prevTabs.filter(t => t.props.itemID !== pinnedTab.id));
                        },
                        undefined,
                        refreshSlot,
                        contentRef,
                        labelRef,
                        toolBarRef
                    );
                    setPinnedTabsMap(prevTabs => ([...prevTabs, panel]));
                    queueMessage(Messages.SWITCH_PANEL_TAB, tabsItemID, tab.id);
                }
            },
            refreshSlot,
            contentRef,
            labelRef,
            toolBarRef
        );
        if (panel) {
            if (index === 0) {
                queueMessage(Messages.SWITCH_PANEL_TAB, tabsItemID, tab.id);
            }
            return panel;
        }
        return null;
    }).filter(Boolean) as React.ReactElement<React.ComponentProps<typeof TabPanel>>[];
}
