import * as React from 'react';
import { Stack, Typography, useTheme } from '@mui/material';
import MenuBar from "./MenuBar";
import SideBar from "./SideBar";
import StatusBar, { StatusBarButton } from "./StatusBar";
import '@renderer/components/ToolPanels/QueryHistoryStatusButton';
import { Size } from "electron";
import { Placement } from './SideBar/ContainerButton';
import { useSettings } from '@renderer/contexts/SettingsContext';
import NotificationAdminPanel, { NotificationAdminPanelButtons, NotificationAdminPanelLabel } from '@renderer/components/ToolPanels/NotificationAdminPanel';
import TabsPanel from '../components/TabsPanel/TabsPanel';
import TabPanel from '../components/TabsPanel/TabPanel';
import ToolButton from '../components/ToolButton';
import { useMessages } from '@renderer/contexts/MessageContext';
import * as Messages from './Messages';
import TabPanelButtons from '../components/TabsPanel/TabPanelButtons';
import { useContainers } from '@renderer/contexts/ApplicationContext';
import Container from '@renderer/containers/Container';
import { SplitPanel, SplitPanelGroup, Splitter } from '@renderer/components/SplitPanel';
import { useNotificationAdmin } from '@renderer/contexts/NotificationContext';
import TabPanelLabel from '@renderer/components/TabsPanel/TabPanelLabel';
import QueryHistoryPanel, { QueryHistoryPanelButtons, QueryHistoryPanelLabel } from '@renderer/components/ToolPanels/QueryHistoryPanel';

const App_toolsTabsPanelVisible = 'App.toolsTabsPanelVisible';

function getWindowDimensions(): Size {
    const { innerWidth: width, innerHeight: height } = window;
    return {
        width,
        height
    };
}

function useWindowDimensions(): Size {
    const [windowDimensions, setWindowDimensions] = React.useState(getWindowDimensions());

    React.useEffect((): ReturnType<React.EffectCallback> => {
        function handleResize(): void {
            setWindowDimensions(getWindowDimensions());
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowDimensions;
}

export const appStatusBarButtons: {
    static: Map<string, React.FC>;
    hidden: Map<string, React.FC>;
} = {
    static: new Map(),
    hidden: new Map(),
};

const App: React.FC = () => {
    const theme = useTheme();
    const { height } = useWindowDimensions();
    const [settings, setSettings] = useSettings("app");
    const [placement, setPlacement] = React.useState<Placement>((settings.placement ?? "left") as Placement);
    const [toolsTabsPanelVisible, setToolsTabsPanelVisible] = React.useState(() => {
        const storedValue = window.sessionStorage.getItem(App_toolsTabsPanelVisible);
        return storedValue !== null ? JSON.parse(storedValue) : false;
    });
    const [middleHeight, setMiddleHeight] = React.useState(height - 60);
    const [sideBarHeight, setSideBarHeight] = React.useState(0);
    const [stackDirection, setStackDirection] = React.useState<'row' | 'row-reverse' | 'column' | 'column-reverse'>("column");
    const { containers, selectedContainer, selectedView } = useContainers();
    const { notificationCounts } = useNotificationAdmin();
    const { sendMessage } = useMessages();

    const menuBarRef = React.useRef<HTMLDivElement>(null);
    const statusBarRef = React.useRef<HTMLDivElement>(null);
    const sideBarRef = React.useRef<HTMLDivElement>(null);

    const { subscribe, unsubscribe } = useMessages();

    const handleToggleToolsTabsPanelMessage = React.useCallback(() => {
        setToolsTabsPanelVisible((prev) => {
            window.sessionStorage.setItem(App_toolsTabsPanelVisible, JSON.stringify(!prev));
            return !prev;
        });
    }, []);

    const handlePlacementChange = React.useCallback((newPlacement: Placement) => {
        setPlacement(newPlacement);
        setSettings("placement", newPlacement);
    }, [setSettings, setPlacement]);

    React.useEffect(() => {
        const directionMap: Record<Placement, 'row' | 'row-reverse' | 'column' | 'column-reverse'> = {
            top: "column",
            bottom: "column-reverse",
            left: "row",
            right: "row-reverse",
        };
        setStackDirection(directionMap[placement]);
    }, [placement]);

    // Register and unregister message handlers
    React.useEffect(() => {
        subscribe(Messages.TOGGLE_TOOOLS_TABS_PANEL, handleToggleToolsTabsPanelMessage);
        subscribe(Messages.CHANGE_SIDE_BAR_PLACEMENT, handlePlacementChange);

        return () => {
            unsubscribe(Messages.TOGGLE_TOOOLS_TABS_PANEL, handleToggleToolsTabsPanelMessage);
            unsubscribe(Messages.CHANGE_SIDE_BAR_PLACEMENT, handlePlacementChange);
        };
    }, [
        subscribe,
        unsubscribe,
        handleToggleToolsTabsPanelMessage,
        handlePlacementChange,
    ]);

    // Adjust middle height based on window and sidebar dimensions
    React.useEffect(() => {
        const calculateMiddleHeight = () => {
            if (!menuBarRef.current || !statusBarRef.current) return;

            let _middleHeight = height - menuBarRef.current.offsetHeight - statusBarRef.current.offsetHeight;

            if (["top", "bottom"].includes(placement) && sideBarRef.current) {
                _middleHeight -= sideBarHeight;
            }

            if (middleHeight !== _middleHeight) {
                setMiddleHeight(_middleHeight);
            }
        };

        calculateMiddleHeight();

        // Add a resize observer to recalculate height dynamically
        const resizeObserver = new ResizeObserver(() => {
            calculateMiddleHeight();
        });

        if (menuBarRef.current) resizeObserver.observe(menuBarRef.current);
        if (statusBarRef.current) resizeObserver.observe(statusBarRef.current);
        if (sideBarRef.current) resizeObserver.observe(sideBarRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [placement, height, sideBarHeight, middleHeight]);

    React.useEffect(() => {
        if (!sideBarRef.current) return;
        const resizeObserver = new ResizeObserver(() => {
            if (sideBarRef.current && sideBarRef.current.offsetHeight !== sideBarHeight) {
                setSideBarHeight(sideBarRef.current.offsetHeight);
            }
        });
        resizeObserver.observe(sideBarRef.current);
        return () => resizeObserver.disconnect();
    }, [sideBarHeight]);

    return (
        <div>
            <MenuBar ref={menuBarRef} />
            <Stack direction={stackDirection}>
                <SideBar placement={placement} ref={sideBarRef} />
                <SplitPanelGroup direction="vertical" style={{ height: middleHeight }} autoSaveId="tools-panel">
                    <SplitPanel>
                        {containers?.map((container) => (
                            <Container key={container.type} hidden={container !== selectedContainer}>
                                {container.container !== undefined &&
                                    <container.container key={container.id}>
                                        {
                                            selectedContainer?.type !== "connections" &&
                                            selectedView?.type === "rendered" &&
                                            selectedView?.render &&
                                            <selectedView.render key={selectedView.id} />
                                        }
                                    </container.container>
                                }
                            </Container>
                        ))}
                    </SplitPanel>
                    <Splitter hidden={!toolsTabsPanelVisible} />
                    <SplitPanel defaultSize={20} hidden={!toolsTabsPanelVisible}>
                        <TabsPanel className="ToolsPanel" itemID="tools-tabs-panel">
                            <TabPanel
                                itemID="notifications"
                                label={<NotificationAdminPanelLabel />}
                                buttons={<NotificationAdminPanelButtons />}
                                content={<NotificationAdminPanel />}
                            />
                            <TabPanel
                                itemID="query-history"
                                label={<QueryHistoryPanelLabel />}
                                buttons={<QueryHistoryPanelButtons />}
                                content={<QueryHistoryPanel />}
                            />
                            <TabPanel
                                itemID="logs"
                                label="Logs"
                                content={
                                    <TabPanelLabel p={2}>
                                        <Typography variant="h6">Logs</Typography>
                                        <Typography variant="body2">Here you can see application logs.</Typography>
                                    </TabPanelLabel>
                                }
                                buttons={
                                    <TabPanelButtons>
                                        <ToolButton>Clear Logs</ToolButton>
                                        <ToolButton>Export Logs</ToolButton>
                                    </TabPanelButtons>
                                }
                            />
                        </TabsPanel>
                    </SplitPanel>
                </SplitPanelGroup>
            </Stack>
            <StatusBar
                ref={statusBarRef}
                buttons={{
                    first: [
                        <StatusBarButton
                            key="notifications"
                            onClick={() => {
                                sendMessage(Messages.TOGGLE_TOOOLS_TABS_PANEL);
                                sendMessage(Messages.SWITCH_PANEL_TAB, "tools-tabs-panel", "notifications");
                            }}
                        >
                            <theme.icons.Error />
                            <span>{notificationCounts.error}</span>
                            <theme.icons.Warning />
                            <span>{notificationCounts.warning}</span>
                            <theme.icons.Hint />
                            <span>{notificationCounts.success + notificationCounts.hint}</span>
                        </StatusBarButton>,
                        ...Array.from(appStatusBarButtons.static.values()).map((Button, index) => (<Button key={index} />)),
                        ...Array.from(appStatusBarButtons.hidden.values()).map((Button, index) => (<Button key={index} />)),
                    ],
                }}
            />
        </div>
    );
};

export default App;
