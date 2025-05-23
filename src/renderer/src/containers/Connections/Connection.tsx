import React, { useEffect } from "react";
import { Stack, styled, Tooltip, useTheme, useThemeProps, Badge, Box } from "@mui/material"; // Importuj Badge z Material-UI
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import ToolButton from "@renderer/components/ToolButton";
import { useTranslation } from "react-i18next";
import { IDatabaseSession } from "@renderer/contexts/DatabaseSession";
import { Messages, useMessages } from "@renderer/contexts/MessageContext";
import { EditorsTabs } from "./ConnectionView/EdiorsTabs";
import { SplitPanel, SplitPanelGroup, Splitter } from "@renderer/components/SplitPanel";
import { UseListenersType } from "@renderer/hooks/useListeners";
import "./ConnectionStatusBar";
import ResultsTabs from "./ConnectionView/ResultsTabs";
import { SQL_RESULT_SQL_QUERY_EXECUTING } from "./ConnectionView/SqlResultPanel";
import UnboundBadge from "@renderer/components/UnboundBadge";
import EditorContentManager from "@renderer/contexts/EditorContentManager";
import { useContainers, useSessions } from "@renderer/contexts/ApplicationContext";
import ConnectionView from "./ConnectionView/ViewSlots/ConnectionView";

const StyledConnection = styled(Stack, {
    name: "Connection",
    slot: "root",
})(({ /*theme*/ }) => ({
    // Add styles for the list container if needed
    height: "100%",
}));

export interface ConnectionProps extends React.ComponentProps<typeof StyledConnection> {
}

interface ConnectionsOwnProps extends ConnectionProps {
    session: IDatabaseSession;
    tabsItemID?: string;
}

export const ConnectionContent: React.FC<ConnectionsOwnProps> = (props) => {
    const { session, children, tabsItemID, ...other } = useThemeProps({ name: "Connection", props });
    const { selectedContainer, selectedView } = useContainers();
    const { selectedSession } = useSessions();
    const [selectedThis, setSelectedThis] = React.useState(false);

    // Utwórz instancję EditorContentManager
    const editorContentManager = React.useMemo(() => new EditorContentManager(session.schema.sch_id), [session.schema.sch_id]);

    // Przechowuj utworzone widoki w stanie
    const [viewsMap, setViewsMap] = React.useState<Record<string, React.ReactNode>>({});

    useEffect(() => {
        setSelectedThis(
            selectedContainer?.type === "connections" &&
            selectedSession?.getUniqueId() === session.info.uniqueId &&
            selectedView !== null
        );
    }, [selectedContainer, selectedView, selectedSession]);

    // Twórz i zapamiętuj widok tylko gdy zmienia się selectedView
    useEffect(() => {
        if (selectedView && selectedView.id && !viewsMap[selectedView.id] && selectedThis) {
            let node: React.ReactNode = null;
            if (selectedView.type === "connection" && selectedView.slots !== null) {
                node = <ConnectionView slots={selectedView.slots} key={selectedView.id} session={session} />;
            } else if (selectedView.type === "rendered" && selectedView.render !== null) {
                node = <selectedView.render key={selectedView.id} />;
            }
            if (node) {
                setViewsMap(prev => ({ ...prev, [selectedView.id]: node }));
            }
        }
    }, [selectedView, session, viewsMap, selectedThis]);

    return (
        <StyledConnection className="Connection-root" {...other}>
            <SplitPanelGroup
                direction="horizontal"
                autoSaveId={`connection-panel-left-${session.schema.sch_id}`}
            >
                <SplitPanel defaultSize={20} hidden={!selectedThis}>
                    {Object.entries(viewsMap).map(([id, node]) => (
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
                <Splitter hidden={!selectedThis} />
                <SplitPanel>
                    <SplitPanelGroup direction="vertical" autoSaveId={`connection-panel-${session.schema.sch_id}`}>
                        <SplitPanel>
                            <EditorsTabs session={session} editorContentManager={editorContentManager} />
                        </SplitPanel>
                        <Splitter />
                        <SplitPanel defaultSize={20}>
                            <ResultsTabs session={session} />
                        </SplitPanel>
                    </SplitPanelGroup>
                </SplitPanel>
            </SplitPanelGroup>
        </StyledConnection>
    );
};

export const ConnectionButtons: React.FC<{ session: IDatabaseSession }> = ({ session }) => {
    const { t } = useTranslation();
    const theme = useTheme();
    const { sendMessage, subscribe, unsubscribe } = useMessages();
    const [gettingMetadata, setGettingMetadata] = React.useState(false);

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
                    <span>
                        <ToolButton
                            onClick={() => sendMessage(Messages.REFRESH_METADATA, { connectionId: session.info.uniqueId })}
                            disabled={gettingMetadata}
                        >
                            <theme.icons.RefreshMetadata />
                        </ToolButton>
                    </span>
                </Tooltip>
            )}
            <Tooltip title={t("disconnect", "Close connection")}>
                <span>
                    <ToolButton
                        onClick={() => sendMessage(Messages.SCHEMA_DISCONNECT, session.info.uniqueId)}
                    >
                        <theme.icons.Disconnected />
                    </ToolButton>
                </span>
            </Tooltip>
        </TabPanelButtons >
    );
};

export const ConnectionLabel: React.FC<{ session: IDatabaseSession }> = ({ session }) => {
    const theme = useTheme();
    const [executingFromList, setExecutingFromList] = React.useState<string[]>([]); // Lista message.from
    const [showLoading, setShowLoading] = React.useState(false); // Stan dla opóźnionego efektu ładowania
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

    React.useEffect(() => {
        let timeout: NodeJS.Timeout | null = null;

        if (executingFromList.length > 0) {
            timeout = setTimeout(() => {
                setShowLoading(true); // Pokaż efekt ładowania po 1000 ms
            }, 1000);
        } else {
            setShowLoading(false); // Ukryj efekt ładowania natychmiast, gdy lista jest pusta
            if (timeout) {
                clearTimeout(timeout);
            }
        }

        return () => {
            if (timeout) {
                clearTimeout(timeout);
            }
        };
    }, [executingFromList]);

    return (
        <TabPanelLabel>
            {showLoading ? (
                <>
                    <theme.icons.Loading key="icon" />
                    {executingFromList.length > 1 && <UnboundBadge key="badge" content={executingFromList.length} size="small" />}
                </>
            ) : session.info.connected ? (
                <theme.icons.Connected /> // Wyświetl ikonę Connected, gdy połączenie jest aktywne
            ) : (
                <theme.icons.Disconnected /> // Wyświetl ikonę Disconnected, gdy połączenie jest nieaktywne
            )}
            <span style={{ color: session.schema.sch_color }}>{session.schema.sch_name}</span>
        </TabPanelLabel>
    );
};
