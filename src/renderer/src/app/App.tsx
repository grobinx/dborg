import * as React from 'react';
import { Stack, useTheme } from '@mui/material';
import MenuBar from "./MenuBar";
import SideBar from "./SideBar";
import StatusBar from "./StatusBar";
import '@renderer/components/ToolPanels/QueryHistoryStatusButton';
import { Placement } from './SideBar/ContainerButton';
import { useSetting } from '@renderer/contexts/SettingsContext';
import TabsPanel from '../components/TabsPanel/TabsPanel';
import TabPanel from '../components/TabsPanel/TabPanel';
import { useMessages } from '@renderer/contexts/MessageContext';
import * as Messages from './Messages';
import { SplitPanel, SplitPanelGroup, Splitter } from '@renderer/components/SplitPanel';
import QueryHistoryPanel, { QueryHistoryPanelButtons, QueryHistoryPanelLabel } from '@renderer/components/ToolPanels/QueryHistoryPanel';
import { ConsoleLogPanel, ConsoleLogsPanelButtons, ConsoleLogsPanelLabel } from '@renderer/components/ToolPanels/ConsoleLogsPanel';
import TabPanelButtons from '@renderer/components/TabsPanel/TabPanelButtons';
import { useTranslation } from 'react-i18next';
import Tooltip from '@renderer/components/Tooltip';
import { ToolButton } from '@renderer/components/buttons/ToolButton';
import FocusContainerHandler from '@renderer/components/useful/FocusContainerHandler';
import AppContainers from './AppContainers';
import { appStatusBarButtons } from './AppStatusBarRegistry';

const App_toolsTabsPanelVisible = 'App.toolsTabsPanelVisible';

const directionMap: Record<Placement, 'row' | 'row-reverse' | 'column' | 'column-reverse'> = {
    top: "column",
    bottom: "column-reverse",
    left: "row",
    right: "row-reverse",
};

const App: React.FC = () => {
    const theme = useTheme();
    const { t } = useTranslation();
    const [placement, setPlacement] = useSetting<Placement>("app", "placement");
    const [toolsTabsPanelVisible, setToolsTabsPanelVisible] = React.useState<boolean>(() => {
        const storedValue = window.sessionStorage.getItem(App_toolsTabsPanelVisible);
        return storedValue !== null ? JSON.parse(storedValue) : false;
    });
    const [stackDirection, setStackDirection] = React.useState<'row' | 'row-reverse' | 'column' | 'column-reverse'>("column");
    const { queueMessage, subscribe, unsubscribe } = useMessages();
    const lastToolItemRef = React.useRef<{ tabsItemID: string; itemID: string } | null>(null);

    console.count("App Render");

    React.useEffect(() => {
        window.sessionStorage.setItem(App_toolsTabsPanelVisible, JSON.stringify(toolsTabsPanelVisible));
    }, [toolsTabsPanelVisible]);

    React.useEffect(() => {
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
                        queueMessage(Messages.SWITCH_PANEL_TAB, tabsItemID, itemID);
                        lastToolItemRef.current = { tabsItemID, itemID };
                        return true;
                    }
                } else {
                    // Zakładki są ukryte, pokaż zakładki i przełącz na wybraną
                    queueMessage(Messages.SWITCH_PANEL_TAB, tabsItemID, itemID);
                    lastToolItemRef.current = { tabsItemID, itemID };
                    return true;
                }
            });
        };

        const handlePlacementChange = (newPlacement: Placement) => {
            setPlacement(newPlacement);
        };

        subscribe(Messages.TOGGLE_TOOLS_TABS_PANEL, handleToggleToolsTabsPanelMessage);
        subscribe(Messages.CHANGE_SIDE_BAR_PLACEMENT, handlePlacementChange);

        return () => {
            unsubscribe(Messages.TOGGLE_TOOLS_TABS_PANEL, handleToggleToolsTabsPanelMessage);
            unsubscribe(Messages.CHANGE_SIDE_BAR_PLACEMENT, handlePlacementChange);
        };
    }, []);

    return (
        <Stack direction="column" style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
            <FocusContainerHandler />
            <MenuBar key="menu-bar" />
            <Stack key="stack-direction" direction={stackDirection} style={{ flexGrow: 1, overflow: 'hidden' }}>
                <SideBar key="side-bar" placement={placement} />
                <SplitPanelGroup key="split-group" direction="vertical" style={{ height: "100%", flexGrow: 1 }} autoSaveId="tools-panel">
                    <SplitPanel key="split-app-containers">
                        <AppContainers />
                    </SplitPanel>
                    <Splitter key="splitter" hidden={!toolsTabsPanelVisible} />
                    <SplitPanel key="split-tools-panel" defaultSize={20} hidden={!toolsTabsPanelVisible}>
                        {toolsTabsPanelVisible && (
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
                                                size="small"
                                                color="main"
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
                        )}
                    </SplitPanel>
                </SplitPanelGroup>
            </Stack>
            <StatusBar
                key="status-bar"
                buttons={{
                    first: [
                        ...Array.from(appStatusBarButtons.static.values()).map((Button, index) => (<Button key={index} />)),
                        ...Array.from(appStatusBarButtons.hidden.values()).map((Button, index) => (<Button key={999 + index} />)),
                    ],
                }}
            />
        </Stack>
    );
};

export default App;
