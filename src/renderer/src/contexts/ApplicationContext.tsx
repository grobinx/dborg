import { Box, useTheme } from '@mui/material';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Messages, useMessages } from './MessageContext';
import SchemaAssistant from '@renderer/containers/SchemaAssistant';
import SchemaBook from '@renderer/containers/SchemaBook';
import Connections from '@renderer/containers/Connections/Connections';
import { useDatabase } from './DatabaseContext';
import * as api from "../../../api/db";
import DatabaseSession, { IDatabaseSession } from './DatabaseSession';
import { usePluginManager } from './PluginManagerContext';
import { uuidv7 } from 'uuidv7';
import { RefreshMetadata, TabPanelChangedMessage } from '@renderer/app/Messages';
import { useToast } from './ToastContext';
import "../containers/Connections/MetadataCollctorStatusBar";
import { CustomContainer, RenderedView, ConnectionView, CustomView } from 'plugins/manager/renderer/Plugin';
import About from '@renderer/About';
import EditableSettings from '@renderer/containers/Settings/EditableSettings';

type SidebarSection = "first" | "last"; // Define the sections for the container buttons
export type ContainerType =
    "new-connection"
    | "connections"
    | "connection-list"
    | "settings"
    | "plugins"
    | "custom";

export interface IContainer {
    id: string; // Unique identifier for the container
    type: ContainerType; // Type of container
    icon: React.ReactNode; // Icon for the button, can be a string or a React node
    label: string; // Title of the button
    section: SidebarSection;
    container?: ({ children }: { children: React.ReactNode }) => React.ReactNode; // Optional container component to be rendered
}

export type ViewType = "rendered" | "connection" | "custom"; // Define the types of views

export interface IView {
    type: ViewType; // Type of the view
    id: string; // Unique identifier for the view
    icon: React.ReactNode; // Icon for the button, can be a string (theme.icon) or a React node
    label: string; // Title of the button
}

// Union type for all view types
export type View =
    RenderedView
    | ConnectionView
    | CustomView;

// Define specific container structures for each ContainerType
interface NewConnectionContainer extends IContainer {
    type: "new-connection";
}

interface ConnectionsContainer extends IContainer {
    type: "connections";
}

interface ConnectionListContainer extends IContainer {
    type: "connection-list";
}

interface SettingsContainer extends IContainer {
    type: "settings";
    views: View[]; // Add views property to match usage
}

interface PluginsContainer extends IContainer {
    type: "plugins";
    views: View[]; // List of views associated with the plugins container
}

// Union type for all container structures
type SpecificContainer =
    | NewConnectionContainer
    | ConnectionsContainer
    | ConnectionListContainer
    | SettingsContainer
    | PluginsContainer
    | CustomContainer;

// Define the structure of the application state
interface ApplicationState {
    containers: SpecificContainer[] | null; // List of all available containers
    selectedContainer: SpecificContainer | null; // Currently selected container
    views: View[] | null; // List of views within the selected container
    selectedView: View | null; // Currently selected view within the selected container
    sessions: IDatabaseSession[] | null; // List of database connections
    selectedSession: IDatabaseSession | null; // Currently selected database connection
}

// Create the context
const ApplicationContext = createContext<ApplicationState | undefined>(undefined);

// Create a provider component
export const ApplicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const { sendMessage, subscribe, unsubscribe } = useMessages();
    const { addToast } = useToast();

    const initialContainersRef = React.useRef<SpecificContainer[]>([
        {
            id: uuidv7(),
            type: "new-connection",
            icon: <theme.icons.NewConnection />,
            label: t("new-connection", "New Connection"),
            section: "first",
            container: () => <SchemaAssistant />,
        },
        {
            id: uuidv7(),
            type: "connection-list",
            icon: <theme.icons.ConnectionList />,
            label: t("connection-list", "Connection List"),
            section: "first",
            container: () => <SchemaBook />,
        },
        {
            id: uuidv7(),
            type: "connections",
            icon: <theme.icons.Connections />,
            label: t("connections", "Connections"),
            section: "first",
            container: ({ children }) => <Connections>{children}</Connections>,
        },
        {
            id: uuidv7(),
            type: "plugins",
            icon: <theme.icons.Plugins />,
            label: t("plugins", "Plugins"),
            section: "last",
            container: ({ children }) => <Box>{children}</Box>,
            views: [
                {
                    type: "rendered",
                    id: "bake-cupcake",
                    icon: <theme.icons.Cupcake />,
                    label: t("bake-cupcake", "Bake a cupcake"),
                    render: () => <div>Bake a cupcake</div>,
                },
                {
                    type: "rendered",
                    id: "make-drink",
                    icon: <theme.icons.Drink />,
                    label: t("make-drink", "Make a drink"),
                    render: () => <div>Make a drink</div>,
                },
            ],
        },
        {
            id: uuidv7(),
            type: "settings",
            icon: <theme.icons.Settings />,
            label: t("settings", "Settings"),
            section: "last",
            container: ({ children }) => <Box>{children}</Box>,
            views: [
                {
                    type: "rendered",
                    id: "about",
                    icon: <theme.icons.Info />,
                    label: t("about", "About"),
                    render: () => <About />,
                },
                {
                    type: "rendered",
                    id: "settings",
                    icon: <theme.icons.Settings />,
                    label: t("application-settings", "Application settings"),
                    render: () => <EditableSettings />,
                },
            ]
        },
    ]);

    const [containers, setContainers] = useState<SpecificContainer[] | null>(null);
    const [selectedContainer, setSelectedContainer] = useState<SpecificContainer | null>(null);
    const [views, setViews] = useState<View[] | null>(null);
    const [selectedView, setSelectedView] = useState<View | null>(null);
    const { connections: databaseConnections } = useDatabase();
    const [sessions, setSessions] = React.useState<IDatabaseSession[] | null>(null);
    const [selectedSession, setSelectedSession] = React.useState<IDatabaseSession | null>(null);
    const [sessionViewState, setSessionViewState] = useState<Record<string, { views: View[]; selectedViewId: string | null }>>({});
    const plugins = usePluginManager();

    // Initialize the containers and set the default selected container
    // this call is after application init or reset webcontent, so we restore connections from main process
    React.useEffect(() => {
        databaseConnections.list().then(async (list) => {
            const connectionsList = await Promise.all(list.map(async (conn) => {
                const newSession = new DatabaseSession(conn);
                await newSession.closeCursors();
                initMetadata(newSession);
                return newSession;
            }));
            setSessions(connectionsList);
            setSelectedSession(connectionsList[connectionsList.length - 1] || null);
        });
    }, [databaseConnections]);

    const updateViewsForSession = React.useCallback((session: IDatabaseSession | null) => {
        if (session) {
            const sessionId = session.info.uniqueId;
            const sessionState = sessionViewState[sessionId];

            if (sessionState) {
                setViews(sessionState.views);
                setSelectedView(
                    sessionState.views.find(v => v.id === sessionState.selectedViewId) || null
                );
            } else {
                const views = plugins.getConnectionViews(session);
                if (views) {
                    setSessionViewState(prev => ({
                        ...prev,
                        [sessionId]: { views, selectedViewId: null },
                    }));
                    setViews(views);
                    setSelectedView(null);
                } else {
                    setViews(null);
                    setSelectedView(null);
                }
            }
        } else {
            setViews(null);
            setSelectedView(null);
        }
    }, [sessionViewState, plugins, sessionViewState]);

    const initMetadata = (session: IDatabaseSession, force?: boolean) => {
        if (!session.info.driver.implements.includes("metadata")) {
            return;
        }
        setTimeout(() => {
            sendMessage(Messages.SESSION_GET_METADATA_START, {
                connectionId: session.info.uniqueId,
                schema: session.schema,
            } as Messages.SessionGetMetadataStart);
            session.getMetadata((current) => {
                sendMessage(Messages.SESSION_GET_METADATA_PROGRESS, {
                    connectionId: session.info.uniqueId,
                    progress: current,
                } as Messages.SessionGetMetadataProgress);
            }, force).then((metadata: api.DatabasesMetadata) => {
                session.metadata = metadata;
                sendMessage(Messages.SESSION_GET_METADATA_SUCCESS, {
                    connectionId: session.info.uniqueId,
                    metadata: metadata,
                } as Messages.SessionGetMetadataSuccess);
            }).catch((error) => {
                sendMessage(Messages.SESSION_GET_METADATA_ERROR, {
                    connectionId: session.info.uniqueId,
                    error: error.message,
                } as Messages.SessionGetMetadataError);
                addToast("error", "Error loading metadata", {
                    reason: error,
                    source: session.schema.sch_name,
                });
            }).finally(() => {
                sendMessage(Messages.SESSION_GET_METADATA_END, {
                    connectionId: session.info.uniqueId,
                } as Messages.SessionGetMetadataEnd);
            });
        }, force ? 250 : 1000);
    };

    useEffect(() => {
        setContainers(initialContainersRef.current);
        setSelectedContainer(initialContainersRef.current[1]);
    }, []);

    useEffect(() => {
        if (selectedContainer?.type === "connections") {
            updateViewsForSession(selectedSession);
        } else if (selectedContainer && "views" in selectedContainer) {
            if (views != selectedContainer.views) {
                setViews(selectedContainer.views);
                setSelectedView(selectedContainer.views[0] || null);
            }
        } else {
            setViews(null);
            setSelectedView(null);
        }
    }, [selectedContainer, selectedSession, updateViewsForSession]);

    const handleSwitchContainer = React.useCallback((containerType: ContainerType) => {
        const targetContainer = containers?.find(c => c.type === containerType);
        if (targetContainer && targetContainer !== selectedContainer) {
            setSelectedContainer(targetContainer);
        }
    }, [containers, selectedContainer]);

    const handleSwitchView = React.useCallback((viewId: string) => {
        if (views) {
            // Sprawdź, czy kliknięto na już wybrany widok
            if (selectedView?.id === viewId) {
                setSelectedView(prev => selectedContainer?.type === "connections" ? null : prev);
                if (selectedSession) {
                    setSessionViewState(prev => ({
                        ...prev,
                        [selectedSession.info.uniqueId]: {
                            views: prev[selectedSession.info.uniqueId]?.views || views,
                            selectedViewId: null, // Odznacz widok
                        },
                    }));
                }
                return;
            }

            // Ustaw nowy widok
            setSelectedView(prev => views.find(v => v.id === viewId) || null);
            if (selectedSession) {
                setSessionViewState(prev => ({
                    ...prev,
                    [selectedSession.info.uniqueId]: {
                        views: prev[selectedSession.info.uniqueId]?.views || views,
                        selectedViewId: viewId,
                    },
                }));
            }
        }
    }, [views, selectedSession, selectedView]);

    const handleEditSchema = React.useCallback((schemaId: string) => {
        sendMessage(Messages.SWITCH_CONTAINER, "new-connection").then(() => {
            sendMessage(Messages.SET_SCHEMA_ID, schemaId);
        });
    }, []);

    const handleCloneEditSchema = React.useCallback((schemaId: string) => {
        sendMessage(Messages.SWITCH_CONTAINER, "new-connection").then(() => {
            sendMessage(Messages.STE_CLONE_SCHEMA_ID, schemaId);
        });
    }, []);

    const handleTabConnectionsChanged = React.useCallback((message: TabPanelChangedMessage) => {
        if (message.tabsItemID !== "connections-tabs-panel") {
            return;
        }
        if (selectedContainer?.type === "connections") {
            const session = sessions?.find(c => c.info.uniqueId === message.itemID);
            setSelectedSession(session ?? null);
            updateViewsForSession(session ?? null);
        }
    }, [sessions, selectedContainer, updateViewsForSession]);

    const handleSchemaConnectSuccess = React.useCallback((connection: api.ConnectionInfo) => {
        setSessions((prev) => {
            const newSession = new DatabaseSession(connection);
            initMetadata(newSession);
            const updatedSessions = [...(prev || []), newSession];

            // Ustaw nowo dodaną sesję jako wybraną
            setSelectedSession(newSession);

            // Zaktualizuj widoki dla nowo wybranej sesji
            updateViewsForSession(newSession);

            return updatedSessions;
        });
    }, [updateViewsForSession]);

    const handleSchemaDisconnectSuccess = React.useCallback((connectionId: string) => {
        setSessions((prev) => {
            const updatedSessions = prev?.filter(session => session.info.uniqueId !== connectionId) || null;

            // Jeśli usunięta sesja była wybraną sesją, ustaw nową wybraną sesję
            if (selectedSession?.info.uniqueId === connectionId) {
                const newSelectedSession = updatedSessions?.[0] || null;
                setSelectedSession(newSelectedSession);

                // Zaktualizuj widoki dla nowo wybranej sesji
                updateViewsForSession(newSelectedSession);
            }

            return updatedSessions;
        });

        // Usuń widoki usuniętej sesji z sessionViewState
        setSessionViewState((prev) => {
            const newState = { ...prev };
            delete newState[connectionId];
            return newState;
        });
    }, [selectedSession, updateViewsForSession]);

    const handleRefreshMetadata = React.useCallback((message: RefreshMetadata) => {
        if (selectedSession && selectedSession.info.uniqueId === message.connectionId) {
            initMetadata(selectedSession, true);
        }
    }, [selectedSession]);

    React.useEffect(() => {
        subscribe(Messages.SWITCH_CONTAINER, handleSwitchContainer);
        subscribe(Messages.SWITCH_VIEW, handleSwitchView);
        subscribe(Messages.EDIT_SCHEMA, handleEditSchema);
        subscribe(Messages.CLONE_EDIT_SCHEMA, handleCloneEditSchema);
        subscribe(Messages.TAB_PANEL_CHANGED, handleTabConnectionsChanged);
        subscribe(Messages.SCHEMA_CONNECT_SUCCESS, handleSchemaConnectSuccess);
        subscribe(Messages.SCHEMA_DISCONNECT_SUCCESS, handleSchemaDisconnectSuccess);
        subscribe(Messages.REFRESH_METADATA, handleRefreshMetadata);

        return () => {
            unsubscribe(Messages.SWITCH_CONTAINER, handleSwitchContainer);
            unsubscribe(Messages.SWITCH_VIEW, handleSwitchView);
            unsubscribe(Messages.EDIT_SCHEMA, handleEditSchema);
            unsubscribe(Messages.CLONE_EDIT_SCHEMA, handleCloneEditSchema);
            unsubscribe(Messages.TAB_PANEL_CHANGED, handleTabConnectionsChanged);
            unsubscribe(Messages.SCHEMA_CONNECT_SUCCESS, handleSchemaConnectSuccess);
            unsubscribe(Messages.SCHEMA_DISCONNECT_SUCCESS, handleSchemaDisconnectSuccess);
            unsubscribe(Messages.REFRESH_METADATA, handleRefreshMetadata);
        };
    }, [
        subscribe,
        unsubscribe,
        handleSwitchContainer,
        handleSwitchView,
        handleEditSchema,
        handleTabConnectionsChanged,
        handleSchemaConnectSuccess,
        handleSchemaDisconnectSuccess,
        handleRefreshMetadata,
    ]);

    return (
        <ApplicationContext.Provider
            value={{
                containers,
                selectedContainer,
                views,
                selectedView,
                sessions: sessions,
                selectedSession: selectedSession,
            }}
        >
            {children}
        </ApplicationContext.Provider>
    );
};

// Custom hook to use the ApplicationContext
export const useApplicationContext = (): ApplicationState => {
    const context = useContext(ApplicationContext);
    if (!context) {
        throw new Error('useApplicationContext must be used within an ApplicationProvider');
    }
    return context;
};

// Custom hook to use containers
export const useContainers = () => {
    const { containers, selectedContainer, views, selectedView } = useApplicationContext();
    return { containers, selectedContainer, views, selectedView };
};

export const useSessions = () => {
    const { sessions, selectedSession } = useApplicationContext();
    return { sessions, selectedSession };
};
