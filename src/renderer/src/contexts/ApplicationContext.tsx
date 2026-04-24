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
import { SWITCH_PANEL_TAB, TabPanelChangedMessage } from '@renderer/app/Messages';
import { CustomContainer, RenderedView, ConnectionView, CustomView, ClickableView } from 'plugins/manager/renderer/Plugin';
import SchemaAssistant from '@renderer/containers/SchemaAssistant';
import ProfileBook from '@renderer/containers/SchemaBook';
import Connections from '@renderer/containers/Connections/Connections';
import About from '@renderer/About';
import EditableSettings from '@renderer/containers/Settings/EditableSettings';
import DeveloperOptions from '@renderer/containers/Settings/DeveloperOptions';
import "../containers/Connections/MetadataCollectorStatusBarButton";
import { acronym } from '@renderer/utils/strings';
import { versionToNumber } from '../../../../src/api/version';

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

export type ViewType = "rendered" | "connection" | "custom" | "clickable";

export interface IView {
    type: ViewType;
    id: string;
    icon: React.ReactNode;
    label: string;
    tooltip?: string;
    section?: SidebarSection;
}

export type View =
    | RenderedView
    | ConnectionView
    | CustomView
    | ClickableView;

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

interface ApplicationContainersState {
    containers: SpecificContainer[] | null;
    selectedContainer: SpecificContainer | null;
    views: View[] | null;
    selectedView: View | null;
}

interface ApplicationSessionsState {
    sessions: IDatabaseSession[] | null;
    selectedSession: IDatabaseSession | null;
}

interface ApplicationSessionStateApi {
    getSessionState: (sessionId: string) => { views: View[]; selectedView: View | null };
}

interface ApplicationState extends ApplicationContainersState, ApplicationSessionsState, ApplicationSessionStateApi { }

interface SubscriptionHandlers {
    switchContainer: (type: ContainerType) => void;
    switchView: (viewId: string) => void;
    editSchema: (schemaId: string) => void;
    cloneEditSchema: (schemaId: string) => void;
    tabConnectionsChanged: (msg: TabPanelChangedMessage) => void;
    profileConnectSuccess: (connection: api.ConnectionInfo) => void;
    schemaDisconnectSuccess: (connectionId: string) => void;
}

const ConnectedViewIcon: React.FC<{ session: IDatabaseSession }> = ({ session }) => {
    const theme = useTheme();

    const acr = acronym(session.profile.sch_name);

    return (
        <span style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
        }}>
            <theme.icons.ConnectedGlow sx={{
                position: 'absolute',
                fontSize: '4rem',
                opacity: 0.4,
                color: 'text.secondary',
                zIndex: 0,
            }} />
            <span style={{
                position: 'relative',
                zIndex: 1,
                fontWeight: 600,
                fontStretch: 'extra-condensed',
                letterSpacing: `${acr.length > 3 ? '-0.1em' : '0'}`,
            }}>
                {acr}
            </span>
        </span>
    )
}

// ============================================================================
// CONTEXT
// ============================================================================

const ApplicationContainersContext = createContext<ApplicationContainersState | undefined>(undefined);
const ApplicationSessionsContext = createContext<ApplicationSessionsState | undefined>(undefined);
const ApplicationSessionStateContext = createContext<ApplicationSessionStateApi | undefined>(undefined);

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
    const [selectedStaticViewId, setSelectedStaticViewId] = useState<string | null>(null);
    const [sessions, setSessions] = useState<IDatabaseSession[] | null>(null);
    const [selectedSession, setSelectedSession] = useState<IDatabaseSession | null>(null);
    const [sessionViewStateVersion, setSessionViewStateVersion] = useState(0);

    const containerIdsRef = React.useRef({
        "new-profile": uuidv7(),
        "profile-list": uuidv7(),
        "connections": uuidv7(),
        "plugins": uuidv7(),
        "settings": uuidv7(),
    });

    // Refs
    const sessionsRef = React.useRef<IDatabaseSession[] | null>(null);
    const iAmDeveloperRef = React.useRef(iAmDeveloper);
    const sessionViewStateRef = React.useRef<Record<string, { views: View[]; selectedViewId: string | null }>>({});
    const subscriptionHandlersRef = React.useRef<SubscriptionHandlers>({
        switchContainer: () => undefined,
        switchView: () => undefined,
        editSchema: () => undefined,
        cloneEditSchema: () => undefined,
        tabConnectionsChanged: () => undefined,
        profileConnectSuccess: () => undefined,
        schemaDisconnectSuccess: () => undefined,
    });

    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================

    const initialContainers = React.useMemo((): SpecificContainer[] => {
        const ids = containerIdsRef.current;
        return [
            {
                id: ids["new-profile"],
                type: "new-profile",
                icon: <theme.icons.NewConnection />,
                label: t("new", "New"),
                tooltip: t("create-new-connection-profile", "Create new connection profile"),
                section: "first",
                container: () => <SchemaAssistant />,
            },
            {
                id: ids["profile-list"],
                type: "profile-list",
                icon: <theme.icons.ConnectionList />,
                label: t("profiles", "Profiles"),
                tooltip: t("manage-connection-profiles", "Manage connection profiles"),
                section: "first",
                container: () => <ProfileBook />,
            },
            {
                id: ids["connections"],
                type: "connections",
                icon: <theme.icons.Connections />,
                label: t("sessions", "Sessions"),
                tooltip: t("active-database-sessions", "Active database sessions"),
                section: "first",
                container: ({ children }) => <Connections>{children}</Connections>,
                disabled: () => (sessionsRef.current === null || sessionsRef.current.length === 0),
            },
            {
                id: ids["plugins"],
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
                id: ids["settings"],
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
    }, [theme, theme.icons, t, iAmDeveloper]);

    const chooseContainer = React.useCallback((list: IDatabaseSession[] | null) => {
        if (!containers) return null;
        if (list && list.length) return containers.find(c => c.type === "connections") || containers[0];
        return containers.find(c => c.type === "profile-list") || containers[0];
    }, [containers]);

    const selectContainer = React.useCallback((container: SpecificContainer | null) => {
        setSelectedContainer(container);

        if (!container || container.type === "connections" || container.type === "profile-list") {
            setSelectedStaticViewId(null);
            return;
        }

        if ("views" in container) {
            if (container.type === "settings") {
                setSelectedStaticViewId("settings");
            } else {
                setSelectedStaticViewId(container.views[0]?.id ?? null);
            }
            return;
        }

        setSelectedStaticViewId(null);
    }, []);

    const views = React.useMemo<View[] | null>(() => {
        if (!selectedContainer) return null;

        if (selectedContainer.type === "connections") {
            if (!selectedSession) return null;
            const sid = selectedSession.info.connectionId;
            const cached = sessionViewStateRef.current[sid];
            if (cached) {
                return cached.views;
            }

            const newViews = plugins.getConnectionViews(selectedSession);
            if (newViews && newViews.length) {
                sessionViewStateRef.current[sid] = { views: newViews, selectedViewId: null };
                return newViews;
            }
            return null;
        }

        if ("views" in selectedContainer) {
            return selectedContainer.views;
        }

        if (selectedContainer.type === "profile-list") {
            return sessions?.map(session => ({
                type: "clickable",
                id: "connection-" + session.info.connectionId,
                icon: <ConnectedViewIcon session={session} />,
                label: session.profile.sch_name,
                onClick: () => {
                    sendMessage(Messages.SWITCH_CONTAINER, "connections").then(() => {
                        sendMessage(SWITCH_PANEL_TAB, "connections-tabs-panel", session.info.connectionId);
                    });
                },
            } as ClickableView)) || null;
        }

        return null;
    }, [selectedContainer, selectedSession, plugins, sessions, sendMessage, sessionViewStateVersion]);

    const selectedView = React.useMemo<View | null>(() => {
        if (!selectedContainer || !views || views.length === 0) return null;

        if (selectedContainer.type === "connections") {
            if (!selectedSession) return null;
            const selectedId = sessionViewStateRef.current[selectedSession.info.connectionId]?.selectedViewId;
            return views.find(v => v.id === selectedId) || null;
        }

        if (selectedContainer.type === "profile-list") {
            return null;
        }

        if (selectedStaticViewId) {
            const selected = views.find(v => v.id === selectedStaticViewId);
            if (selected) return selected;
        }

        if (selectedContainer.type === "settings") {
            return views.find(v => v.id === "settings") || views[0] || null;
        }

        return views[0] || null;
    }, [selectedContainer, selectedSession, views, selectedStaticViewId, sessionViewStateVersion]);

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
            selectContainer(target);
        }
    }, [containers, selectedContainer, selectContainer]);

    const handleSwitchView = React.useCallback((viewId: string) => {
        if (!views) return;

        if (selectedView?.id === viewId) {
            const isConn = selectedContainer?.type === "connections";
            if (isConn && selectedSession) {
                sessionViewStateRef.current[selectedSession.info.connectionId] = {
                    views: sessionViewStateRef.current[selectedSession.info.connectionId]?.views || views,
                    selectedViewId: null,
                };
                setSessionViewStateVersion(prev => prev + 1);
            }
            return;
        }

        if (selectedContainer?.type === "profile-list") {
            const target = views.find(v => v.id === viewId) || null;
            if (target && target.type === "clickable") {
                target.onClick();
            }
            return;
        }

        if (selectedContainer?.type === "connections" && selectedSession) {
            sessionViewStateRef.current[selectedSession.info.connectionId] = {
                views: sessionViewStateRef.current[selectedSession.info.connectionId]?.views || views,
                selectedViewId: viewId,
            };
            setSessionViewStateVersion(prev => prev + 1);
            return;
        }

        setSelectedStaticViewId(viewId);
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
        const session = sessions?.find(s => s.info.connectionId === msg.itemID) || null;
        setSelectedSession(session);
    }, [sessions, selectedContainer]);

    const handleProfileConnectSuccess = React.useCallback((connection: api.ConnectionInfo) => {
        setSessions(prev => {
            const newSession = new DatabaseSession(connection);
            const version = versionToNumber(newSession.getVersion() ?? "0.0.0");
            const supportVersion = versionToNumber(newSession.info.driver.supports.minVersion || "0.0.0");
            if (version < supportVersion) {
                addToast("error", t("database-version-not-supported", "Database version {{version}} is lower than supported {{supportVersion}}.", { version: newSession.getVersion(), supportVersion: newSession.info.driver.supports.minVersion }), {
                    source: newSession.profile.sch_name,
                    timeout: 0,
                });
            }
            const updated = [...(prev || []), newSession];
            setSelectedSession(newSession);
            sessionsRef.current = updated;
            return updated;
        });
    }, [addToast, t]);

    const handleSchemaDisconnectSuccess = React.useCallback((connectionId: string) => {
        setSessions(prev => {
            const filtered = prev?.filter(s => s.info.connectionId !== connectionId) || null;
            if (selectedSession?.info.connectionId === connectionId) {
                const nextSel = filtered?.[0] || null;
                setSelectedSession(nextSel);
            }
            if (!filtered || filtered.length === 0) {
                selectContainer(chooseContainer(filtered));
            }
            sessionsRef.current = filtered;
            return filtered;
        });
        delete sessionViewStateRef.current[connectionId];
    }, [selectedSession, chooseContainer, selectContainer]);

    // Keep latest handler implementations without forcing re-subscriptions.
    subscriptionHandlersRef.current.switchContainer = handleSwitchContainer;
    subscriptionHandlersRef.current.switchView = handleSwitchView;
    subscriptionHandlersRef.current.editSchema = handleEditSchema;
    subscriptionHandlersRef.current.cloneEditSchema = handleCloneEditSchema;
    subscriptionHandlersRef.current.tabConnectionsChanged = handleTabConnectionsChanged;
    subscriptionHandlersRef.current.profileConnectSuccess = handleProfileConnectSuccess;
    subscriptionHandlersRef.current.schemaDisconnectSuccess = handleSchemaDisconnectSuccess;

    // ========================================================================
    // EFFECTS
    // ========================================================================

    // Inicjalizacja kontenerów przy zmianie ustawień dewelopera
    useEffect(() => {
        const next = initialContainers;
        setContainers(next);
        if (iAmDeveloperRef.current !== iAmDeveloper) {
            iAmDeveloperRef.current = iAmDeveloper;
            const settings = next.find(c => c.type === "settings") || null;
            selectContainer(settings);
        } else {
            // Re-match po typie po przebudowie listy (np. zmiana motywu/języka)
            setSelectedContainer(prev =>
                prev ? (next.find(c => c.type === prev.type) ?? null) : null
            );
        }
    }, [initialContainers, iAmDeveloper, selectContainer]);

    // Inicjalizacja sesji po starcie kontekstu
    useEffect(() => {
        if (!contextInitialized) return;
        databaseConnections.list().then(async list => {
            const restored = await Promise.all(list.map(async conn => {
                return new DatabaseSession(conn, true);
            }));
            setSessions(restored);
            sessionsRef.current = restored;
            const last = restored[restored.length - 1] || null;
            setSelectedSession(last);
            const autoContainer = chooseContainer(restored);
            selectContainer(autoContainer);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextInitialized]);

    // Subskrypcje na wiadomości i eventy
    useEffect(() => {
        const onSwitchContainer = (type: ContainerType) => {
            subscriptionHandlersRef.current.switchContainer(type);
        };
        const onSwitchView = (viewId: string) => {
            subscriptionHandlersRef.current.switchView(viewId);
        };
        const onEditSchema = (schemaId: string) => {
            subscriptionHandlersRef.current.editSchema(schemaId);
        };
        const onCloneEditSchema = (schemaId: string) => {
            subscriptionHandlersRef.current.cloneEditSchema(schemaId);
        };
        const onTabConnectionsChanged = (msg: TabPanelChangedMessage) => {
            subscriptionHandlersRef.current.tabConnectionsChanged(msg);
        };

        const offDisconnecting = onEvent("disconnecting", e => {
            if (e.status === "success") {
                subscriptionHandlersRef.current.schemaDisconnectSuccess(e.connectionUniqueId);
            }
        });
        const offConnecting = onEvent("connecting", e => {
            if (e.status === "success" && e.connection) {
                subscriptionHandlersRef.current.profileConnectSuccess(e.connection);
            }
        });

        subscribe(Messages.SWITCH_CONTAINER, onSwitchContainer);
        subscribe(Messages.SWITCH_VIEW, onSwitchView);
        subscribe(Messages.EDIT_PROFILE, onEditSchema);
        subscribe(Messages.CLONE_EDIT_PROFILE, onCloneEditSchema);
        subscribe(Messages.TAB_PANEL_CHANGED, onTabConnectionsChanged);

        return () => {
            unsubscribe(Messages.SWITCH_CONTAINER, onSwitchContainer);
            unsubscribe(Messages.SWITCH_VIEW, onSwitchView);
            unsubscribe(Messages.EDIT_PROFILE, onEditSchema);
            unsubscribe(Messages.CLONE_EDIT_PROFILE, onCloneEditSchema);
            unsubscribe(Messages.TAB_PANEL_CHANGED, onTabConnectionsChanged);
            offDisconnecting();
            offConnecting();
        };
    }, [onEvent, subscribe, unsubscribe]);

    // ========================================================================
    // RENDER
    // ========================================================================

    const containersContextValue = React.useMemo(() => ({
        containers,
        selectedContainer,
        views,
        selectedView,
    }), [containers, selectedContainer, views, selectedView]);

    const sessionsContextValue = React.useMemo(() => ({
        sessions,
        selectedSession,
    }), [sessions, selectedSession]);

    const sessionStateContextValue = React.useMemo(() => ({
        getSessionState,
    }), [getSessionState]);

    return (
        <ApplicationContainersContext.Provider value={containersContextValue}>
            <ApplicationSessionsContext.Provider value={sessionsContextValue}>
                <ApplicationSessionStateContext.Provider value={sessionStateContextValue}>
                    {children}
                </ApplicationSessionStateContext.Provider>
            </ApplicationSessionsContext.Provider>
        </ApplicationContainersContext.Provider>
    );
};

// ============================================================================
// HOOKS
// ============================================================================

export const useApplicationContext = (): ApplicationState => {
    const containersContext = useContext(ApplicationContainersContext);
    const sessionsContext = useContext(ApplicationSessionsContext);
    const sessionStateContext = useContext(ApplicationSessionStateContext);
    if (!containersContext || !sessionsContext || !sessionStateContext) {
        throw new Error('useApplicationContext must be used within an ApplicationProvider');
    }
    return {
        ...containersContext,
        ...sessionsContext,
        ...sessionStateContext,
    };
};

export const useContainers = (): ApplicationContainersState => {
    const context = useContext(ApplicationContainersContext);
    if (!context) {
        throw new Error('useContainers must be used within an ApplicationProvider');
    }
    return context;
};

export const useSessions = (): ApplicationSessionsState => {
    const context = useContext(ApplicationSessionsContext);
    if (!context) {
        throw new Error('useSessions must be used within an ApplicationProvider');
    }
    return context;
};

export const useSessionState = (sessionId: string) => {
    const context = useContext(ApplicationSessionStateContext);
    if (!context) {
        throw new Error('useSessionState must be used within an ApplicationProvider');
    }
    return context.getSessionState(sessionId);
};
