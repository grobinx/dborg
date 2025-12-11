import { useTheme } from '@mui/material';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { uuidv7 } from 'uuidv7';
import * as api from "../../../api/db";
import { Messages, useMessages } from './MessageContext';
import { useToast } from './ToastContext';
import { useSetting } from './SettingsContext';
import { useProfiles } from './ProfilesContext';
import { useDatabase } from './DatabaseContext';
import { usePluginManager } from './PluginManagerContext';
import DatabaseSession, { IDatabaseSession } from './DatabaseSession';
import { RefreshMetadata, TabPanelChangedMessage } from '@renderer/app/Messages';
import { CustomContainer, RenderedView, ConnectionView, CustomView } from 'plugins/manager/renderer/Plugin';
import SchemaAssistant from '@renderer/containers/SchemaAssistant';
import ProfileBook from '@renderer/containers/SchemaBook';
import Connections from '@renderer/containers/Connections/Connections';
import About from '@renderer/About';
import EditableSettings from '@renderer/containers/Settings/EditableSettings';
import DeveloperOptions from '@renderer/containers/Settings/DeveloperOptions';
import "../containers/Connections/MetadataCollctorStatusBar";

// ============================================================================
// TYPES
// ============================================================================

type SidebarSection = "first" | "last";
export type ContainerType =
    "new-profile"
    | "connections"
    | "profile-list"
    | "settings"
    | "plugins"
    | "custom";

export interface IContainer {
    id: string;
    type: ContainerType;
    icon: React.ReactNode;
    label: string;
    tooltip?: string;
    section: SidebarSection;
    container?: ({ children }: { children?: React.ReactNode }) => React.ReactNode;
    disabled?: () => boolean;
}

export type ViewType = "rendered" | "connection" | "custom";

export interface IView {
    type: ViewType;
    id: string;
    icon: React.ReactNode;
    label: string;
    tooltip?: string;
    section?: SidebarSection;
}

export type View =
    RenderedView
    | ConnectionView
    | CustomView;

interface NewProfileContainer extends IContainer { type: "new-profile"; }
interface ConnectionsContainer extends IContainer { type: "connections"; }
interface ProfileListContainer extends IContainer { type: "profile-list"; }
interface SettingsContainer extends IContainer { type: "settings"; views: View[]; }
interface PluginsContainer extends IContainer { type: "plugins"; views: View[]; }

type SpecificContainer =
    | NewProfileContainer
    | ConnectionsContainer
    | ProfileListContainer
    | SettingsContainer
    | PluginsContainer
    | CustomContainer;

interface ApplicationState {
    containers: SpecificContainer[] | null;
    selectedContainer: SpecificContainer | null;
    views: View[] | null;
    selectedView: View | null;
    sessions: IDatabaseSession[] | null;
    selectedSession: IDatabaseSession | null;
    getSessionState: (sessionId: string) => { views: View[]; selectedView: View | null };
}

// ============================================================================
// CONTEXT
// ============================================================================

const ApplicationContext = createContext<ApplicationState | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export const ApplicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Hooks
    const theme = useTheme();
    const { t } = useTranslation();
    const { sendMessage, queueMessage, subscribe, unsubscribe } = useMessages();
    const addToast = useToast();
    const [iAmDeveloper] = useSetting<boolean>("app", "i_am_developer");
    const { onEvent } = useProfiles();
    const plugins = usePluginManager();
    const { initialized: contextInitialized, connections: databaseConnections } = useDatabase();

    // State
    const [containers, setContainers] = useState<SpecificContainer[] | null>(null);
    const [selectedContainer, setSelectedContainer] = useState<SpecificContainer | null>(null);
    const [views, setViews] = useState<View[] | null>(null);
    const [selectedView, setSelectedView] = useState<View | null>(null);
    const [sessions, setSessions] = useState<IDatabaseSession[] | null>(null);
    const [selectedSession, setSelectedSession] = useState<IDatabaseSession | null>(null);

    // Refs
    const sessionsRef = React.useRef<IDatabaseSession[] | null>(null);
    const iAmDeveloperRef = React.useRef(iAmDeveloper);
    const sessionViewStateRef = React.useRef<Record<string, { views: View[]; selectedViewId: string | null }>>({});

    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================

    const initialContainers = React.useCallback((): SpecificContainer[] => {
        return [
            {
                id: uuidv7(),
                type: "new-profile",
                icon: <theme.icons.NewConnection />,
                label: t("new", "New"),
                tooltip: t("create-new-connection-profile", "Create new connection profile"),
                section: "first",
                container: () => <SchemaAssistant />,
            },
            {
                id: uuidv7(),
                type: "profile-list",
                icon: <theme.icons.ConnectionList />,
                label: t("profiles", "Profiles"),
                tooltip: t("manage-connection-profiles", "Manage connection profiles"),
                section: "first",
                container: () => <ProfileBook />,
            },
            {
                id: uuidv7(),
                type: "connections",
                icon: <theme.icons.Connections />,
                label: t("sessions", "Sessions"),
                tooltip: t("active-database-sessions", "Active database sessions"),
                section: "first",
                container: ({ children }) => <Connections>{children}</Connections>,
                disabled: () => (sessionsRef.current === null || sessionsRef.current.length === 0),
            },
            {
                id: uuidv7(),
                type: "plugins",
                icon: <theme.icons.Plugins />,
                label: t("plugins", "Plugins"),
                section: "last",
                container: ({ children }) => children,
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
                label: t("manage", "Manage"),
                section: "last",
                container: ({ children }) => children,
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
                        label: t("settings", "Settings"),
                        render: () => <EditableSettings />,
                    },
                    iAmDeveloper && {
                        type: "rendered",
                        id: "developer-view",
                        icon: <theme.icons.Developer />,
                        label: t("developer-view", "Developer"),
                        tooltip: t("manage-developer-options", "Manage developer options"),
                        render: () => <DeveloperOptions />,
                    },
                ].filter(Boolean) as View[],
            },
        ];
    }, [theme.icons, t, iAmDeveloper]);

    const chooseContainer = React.useCallback((list: IDatabaseSession[] | null) => {
        if (!containers) return null;
        if (list && list.length) return containers.find(c => c.type === "connections") || containers[0];
        return containers.find(c => c.type === "profile-list") || containers[0];
    }, [containers]);

    const initMetadata = React.useCallback((session: IDatabaseSession, force?: boolean) => {
        if (!session.info.driver.implements.includes("metadata")) return;
        setTimeout(() => {
            queueMessage(Messages.SESSION_GET_METADATA_START, {
                connectionId: session.info.uniqueId,
                profile: session.profile,
            } as Messages.SessionGetMetadataStart);

            session.getMetadata((current) => {
                queueMessage(Messages.SESSION_GET_METADATA_PROGRESS, {
                    connectionId: session.info.uniqueId,
                    progress: current,
                } as Messages.SessionGetMetadataProgress);
            }, force).then((metadata: api.DatabasesMetadata) => {
                session.metadata = metadata;
                queueMessage(Messages.SESSION_GET_METADATA_SUCCESS, {
                    connectionId: session.info.uniqueId,
                    metadata,
                } as Messages.SessionGetMetadataSuccess);
            }).catch((error) => {
                queueMessage(Messages.SESSION_GET_METADATA_ERROR, {
                    connectionId: session.info.uniqueId,
                    error: error.message,
                } as Messages.SessionGetMetadataError);
                addToast("error", "Error loading metadata", {
                    reason: error,
                    source: session.profile.sch_name,
                });
            }).finally(() => {
                queueMessage(Messages.SESSION_GET_METADATA_END, {
                    connectionId: session.info.uniqueId,
                } as Messages.SessionGetMetadataEnd);
            });
        }, force ? 500 : 2000);
    }, [queueMessage, addToast]);

    const updateSessionViews = React.useCallback((session: IDatabaseSession | null) => {
        if (!session) {
            setViews(null);
            setSelectedView(null);
            return;
        }
        const sid = session.info.uniqueId;
        const cached = sessionViewStateRef.current[sid];
        if (cached) {
            setViews(cached.views);
            setSelectedView(cached.views.find(v => v.id === cached.selectedViewId) || null);
            return;
        }
        const newViews = plugins.getConnectionViews(session);
        if (newViews && newViews.length) {
            sessionViewStateRef.current[sid] = { views: newViews, selectedViewId: null };
            setViews(newViews);
            setSelectedView(null);
        } else {
            setViews(null);
            setSelectedView(null);
        }
    }, [plugins]);

    const updateViewsForContainer = React.useCallback((container: SpecificContainer | null, session: IDatabaseSession | null) => {
        if (!container) {
            setViews(null);
            setSelectedView(null);
            return;
        }
        if (container.type === "connections") {
            updateSessionViews(session);
            return;
        }
        if ('views' in container) {
            const list = container.views;
            setViews(list);
            if (container.type === "settings") {
                setSelectedView(list.find(v => v.id === "settings") || list[0] || null);
            } else {
                setSelectedView(list[0] || null);
            }
        } else {
            setViews(null);
            setSelectedView(null);
        }
    }, [updateSessionViews]);

    const getSessionState = React.useCallback((sessionId: string) => {
        return {
            views: sessionViewStateRef.current[sessionId]?.views || [],
            selectedView: sessionViewStateRef.current[sessionId]?.views.find(v => v.id === sessionViewStateRef.current[sessionId]?.selectedViewId) || null,
        };
    }, []);

    // ========================================================================
    // HANDLERS
    // ========================================================================

    const handleSwitchContainer = React.useCallback((type: ContainerType) => {
        if (!containers) return;
        const target = containers.find(c => c.type === type) || null;
        if (target && target !== selectedContainer) {
            setSelectedContainer(target);
            updateViewsForContainer(target, selectedSession);
        }
    }, [containers, selectedContainer, selectedSession, updateViewsForContainer]);

    const handleSwitchView = React.useCallback((viewId: string) => {
        if (!views) return;
        if (selectedView?.id === viewId) {
            const isConn = selectedContainer?.type === "connections";
            setSelectedView(isConn ? null : selectedView);
            if (isConn && selectedSession) {
                sessionViewStateRef.current[selectedSession.info.uniqueId] = {
                    views: sessionViewStateRef.current[selectedSession.info.uniqueId]?.views || views,
                    selectedViewId: null,
                };
            }
            return;
        }
        const next = views.find(v => v.id === viewId) || null;
        setSelectedView(next);
        if (selectedContainer?.type === "connections" && selectedSession) {
            sessionViewStateRef.current[selectedSession.info.uniqueId] = {
                views: sessionViewStateRef.current[selectedSession.info.uniqueId]?.views || views,
                selectedViewId: viewId,
            };
        }
    }, [views, selectedView, selectedContainer, selectedSession]);

    const handleEditSchema = React.useCallback((schemaId: string) => {
        sendMessage(Messages.SWITCH_CONTAINER, "new-profile").then(() => {
            queueMessage(Messages.SET_PROFILE_ID, schemaId);
        });
    }, [sendMessage, queueMessage]);

    const handleCloneEditSchema = React.useCallback((schemaId: string) => {
        sendMessage(Messages.SWITCH_CONTAINER, "new-profile").then(() => {
            queueMessage(Messages.SET_CLONE_PROFILE_ID, schemaId);
        });
    }, [sendMessage, queueMessage]);

    const handleTabConnectionsChanged = React.useCallback((msg: TabPanelChangedMessage) => {
        if (msg.tabsItemID !== "connections-tabs-panel") return;
        if (selectedContainer?.type !== "connections") return;
        const session = sessions?.find(s => s.info.uniqueId === msg.itemID) || null;
        setSelectedSession(session);
        updateViewsForContainer(selectedContainer, session);
    }, [sessions, selectedContainer, updateViewsForContainer]);

    const handleProfileConnectSuccess = React.useCallback((connection: api.ConnectionInfo) => {
        setSessions(prev => {
            const newSession = new DatabaseSession(connection);
            initMetadata(newSession);
            const updated = [...(prev || []), newSession];
            setSelectedSession(newSession);
            updateViewsForContainer(selectedContainer, newSession);
            sessionsRef.current = updated;
            return updated;
        });
    }, [selectedContainer, updateViewsForContainer, initMetadata]);

    const handleSchemaDisconnectSuccess = React.useCallback((connectionId: string) => {
        setSessions(prev => {
            const filtered = prev?.filter(s => s.info.uniqueId !== connectionId) || null;
            if (selectedSession?.info.uniqueId === connectionId) {
                const nextSel = filtered?.[0] || null;
                setSelectedSession(nextSel);
            }
            if (!filtered || filtered.length === 0) {
                setSelectedContainer(chooseContainer(filtered));
            }
            sessionsRef.current = filtered;
            return filtered;
        });
        delete sessionViewStateRef.current[connectionId];
    }, [selectedSession, chooseContainer]);

    const handleRefreshMetadata = React.useCallback((msg: RefreshMetadata) => {
        if (selectedSession && selectedSession.info.uniqueId === msg.connectionId) {
            initMetadata(selectedSession, true);
        }
    }, [selectedSession, initMetadata]);

    // ========================================================================
    // EFFECTS
    // ========================================================================

    // Inicjalizacja kontenerów przy zmianie ustawień dewelopera
    useEffect(() => {
        const next = initialContainers();
        setContainers(next);
        if (iAmDeveloperRef.current !== iAmDeveloper) {
            iAmDeveloperRef.current = iAmDeveloper;
            const settings = next.find(c => c.type === "settings") || null;
            setSelectedContainer(settings);
            updateViewsForContainer(settings, selectedSession);
        } else {
            updateViewsForContainer(selectedContainer, selectedSession);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [iAmDeveloper]);

    // Inicjalizacja sesji po starcie kontekstu
    useEffect(() => {
        if (!contextInitialized) return;
        databaseConnections.list().then(async list => {
            const restored = await Promise.all(list.map(async conn => {
                const s = new DatabaseSession(conn);
                await s.closeCursors();
                initMetadata(s);
                return s;
            }));
            setSessions(restored);
            sessionsRef.current = restored;
            const last = restored[restored.length - 1] || null;
            setSelectedSession(last);
            const autoContainer = chooseContainer(restored);
            setSelectedContainer(prev => prev || autoContainer);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextInitialized]);

    // Aktualizacja widoków przy zmianie kontenera lub sesji
    useEffect(() => {
        updateViewsForContainer(selectedContainer, selectedSession);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedContainer, selectedSession]);

    // Subskrypcje na wiadomości i eventy
    useEffect(() => {
        const offDisconnecting = onEvent("disconnecting", e => {
            if (e.status === "success") handleSchemaDisconnectSuccess(e.connectionUniqueId);
        });
        const offConnecting = onEvent("connecting", e => {
            if (e.status === "success") handleProfileConnectSuccess(e.connection!);
        });

        subscribe(Messages.SWITCH_CONTAINER, handleSwitchContainer);
        subscribe(Messages.SWITCH_VIEW, handleSwitchView);
        subscribe(Messages.EDIT_PROFILE, handleEditSchema);
        subscribe(Messages.CLONE_EDIT_PROFILE, handleCloneEditSchema);
        subscribe(Messages.TAB_PANEL_CHANGED, handleTabConnectionsChanged);
        subscribe(Messages.REFRESH_METADATA, handleRefreshMetadata);

        return () => {
            unsubscribe(Messages.SWITCH_CONTAINER, handleSwitchContainer);
            unsubscribe(Messages.SWITCH_VIEW, handleSwitchView);
            unsubscribe(Messages.EDIT_PROFILE, handleEditSchema);
            unsubscribe(Messages.CLONE_EDIT_PROFILE, handleCloneEditSchema);
            unsubscribe(Messages.TAB_PANEL_CHANGED, handleTabConnectionsChanged);
            unsubscribe(Messages.REFRESH_METADATA, handleRefreshMetadata);
            offDisconnecting();
            offConnecting();
        };
    }, [
        handleSwitchContainer,
        handleSwitchView,
        handleEditSchema,
        handleCloneEditSchema,
        handleTabConnectionsChanged,
        handleProfileConnectSuccess,
        handleSchemaDisconnectSuccess,
        handleRefreshMetadata,
        onEvent,
        subscribe,
        unsubscribe,
    ]);

    // ========================================================================
    // RENDER
    // ========================================================================

    return (
        <ApplicationContext.Provider
            value={{
                containers,
                selectedContainer,
                views,
                selectedView,
                sessions,
                selectedSession,
                getSessionState,
            }}
        >
            {children}
        </ApplicationContext.Provider>
    );
};

// ============================================================================
// HOOKS
// ============================================================================

export const useApplicationContext = (): ApplicationState => {
    const context = useContext(ApplicationContext);
    if (!context) {
        throw new Error('useApplicationContext must be used within an ApplicationProvider');
    }
    return context;
};

export const useContainers = () => {
    const { containers, selectedContainer, views, selectedView } = useApplicationContext();
    return { containers, selectedContainer, views, selectedView };
};

export const useSessions = () => {
    const { sessions, selectedSession } = useApplicationContext();
    return { sessions, selectedSession };
};

export const useSessionState = (sessionId: string) => {
    const { getSessionState } = useApplicationContext();
    return getSessionState(sessionId);
};
