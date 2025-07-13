import * as React from 'react';
import { Stack, Tooltip, useTheme } from '@mui/material';
import MenuBar from "./MenuBar";
import SideBar from "./SideBar";
import StatusBar from "./StatusBar";
import '@renderer/components/ToolPanels/QueryHistoryStatusButton';
import { Size } from "electron";
import { Placement } from './SideBar/ContainerButton';
import { useSettings } from '@renderer/contexts/SettingsContext';
import TabsPanel from '../components/TabsPanel/TabsPanel';
import TabPanel from '../components/TabsPanel/TabPanel';
import { useMessages } from '@renderer/contexts/MessageContext';
import * as Messages from './Messages';
import { useContainers } from '@renderer/contexts/ApplicationContext';
import Container from '@renderer/containers/Container';
import { SplitPanel, SplitPanelGroup, Splitter } from '@renderer/components/SplitPanel';
import QueryHistoryPanel, { QueryHistoryPanelButtons, QueryHistoryPanelLabel } from '@renderer/components/ToolPanels/QueryHistoryPanel';
import { ConsoleLogPanel, ConsoleLogsPanelButtons, ConsoleLogsPanelLabel } from '@renderer/components/ToolPanels/ConsoleLogsPanel';
import TabPanelButtons from '@renderer/components/TabsPanel/TabPanelButtons';
import ToolButton from '@renderer/components/ToolButton';
import { useTranslation } from 'react-i18next';

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
    const { t } = useTranslation();
    const { height } = useWindowDimensions();
    const [settings, setSettings] = useSettings("app");
    const [placement, setPlacement] = React.useState<Placement>((settings.placement ?? "left") as Placement);
    const [toolsTabsPanelVisible, setToolsTabsPanelVisible] = React.useState<boolean>(() => {
        const storedValue = window.sessionStorage.getItem(App_toolsTabsPanelVisible);
        return storedValue !== null ? JSON.parse(storedValue) : false;
    });
    const [middleHeight, setMiddleHeight] = React.useState(height - 60);
    const [sideBarHeight, setSideBarHeight] = React.useState(0);
    const [stackDirection, setStackDirection] = React.useState<'row' | 'row-reverse' | 'column' | 'column-reverse'>("column");
    const { containers, selectedContainer, selectedView } = useContainers();
    const { emit, subscribe, unsubscribe } = useMessages();
    const lastToolItemRef = React.useRef<{ tabsItemID: string; itemID: string } | null>(null);

    const menuBarRef = React.useRef<HTMLDivElement>(null);
    const statusBarRef = React.useRef<HTMLDivElement>(null);
    const sideBarRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        window.sessionStorage.setItem(App_toolsTabsPanelVisible, JSON.stringify(toolsTabsPanelVisible));
    }, [toolsTabsPanelVisible]);

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
        const handleToggleToolsTabsPanelMessage = (tabsItemID: string, itemID: string) => {
            setToolsTabsPanelVisible((prev) => {
                if (prev) {
                    // Zakładki są widoczne
                    if (lastToolItemRef.current?.tabsItemID === tabsItemID && lastToolItemRef.current?.itemID === itemID) {
                        // Jeśli przełączamy się na tę samą zakładkę, ukryj zakładki
                        lastToolItemRef.current = null;
                        return false;
                    } else {
                        // Jeśli przełączamy się na inną zakładkę, przełącz na wybraną
                        emit(Messages.SWITCH_PANEL_TAB, tabsItemID, itemID);
                        lastToolItemRef.current = { tabsItemID, itemID };
                        return true;
                    }
                } else {
                    // Zakładki są ukryte, pokaż zakładki i przełącz na wybraną
                    emit(Messages.SWITCH_PANEL_TAB, tabsItemID, itemID);
                    lastToolItemRef.current = { tabsItemID, itemID };
                    return true;
                }
            });
        };

        const handlePlacementChange = (newPlacement: Placement) => {
            setPlacement(newPlacement);
            setSettings("placement", newPlacement);
        };

        subscribe(Messages.TOGGLE_TOOLS_TABS_PANEL, handleToggleToolsTabsPanelMessage);
        subscribe(Messages.CHANGE_SIDE_BAR_PLACEMENT, handlePlacementChange);

        return () => {
            unsubscribe(Messages.TOGGLE_TOOLS_TABS_PANEL, handleToggleToolsTabsPanelMessage);
            unsubscribe(Messages.CHANGE_SIDE_BAR_PLACEMENT, handlePlacementChange);
        };
    }, [emit, setSettings]);

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
            setSideBarHeight(prev => {
                if (sideBarRef.current) {
                    return sideBarRef.current.offsetHeight;
                }
                return prev;
            });
        });
        resizeObserver.observe(sideBarRef.current);
        return () => resizeObserver.disconnect();
    }, []);

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
                        <TabsPanel
                            className="ToolsPanel"
                            itemID="tools-tabs-panel"
                            buttons={
                                <TabPanelButtons>
                                    <Tooltip title={t("hide-tools-panel", "Hide Tools Panel")}>
                                        <ToolButton
                                            onClick={() => {
                                                setToolsTabsPanelVisible(!toolsTabsPanelVisible);
                                                lastToolItemRef.current = null;
                                            }}
                                        >
                                            <theme.icons.ExpandMore />
                                        </ToolButton>
                                    </Tooltip>
                                </TabPanelButtons>
                            }
                        >
                            <TabPanel
                                itemID="logs"
                                label={<ConsoleLogsPanelLabel />}
                                buttons={<ConsoleLogsPanelButtons />}
                                content={<ConsoleLogPanel />}
                            />
                            <TabPanel
                                itemID="query-history"
                                label={<QueryHistoryPanelLabel />}
                                buttons={<QueryHistoryPanelButtons />}
                                content={<QueryHistoryPanel />}
                            />
                        </TabsPanel>
                    </SplitPanel>
                </SplitPanelGroup>
            </Stack>
            <StatusBar
                ref={statusBarRef}
                buttons={{
                    first: [
                        ...Array.from(appStatusBarButtons.static.values()).map((Button, index) => (<Button key={index} />)),
                        ...Array.from(appStatusBarButtons.hidden.values()).map((Button, index) => (<Button key={999 + index} />)),
                    ],
                }}
            />
        </div>
    );
};

export default App;
