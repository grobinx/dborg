import React from "react";
import { styled, Box, Tabs, Tab, useThemeProps, Stack, Paper, List, ListItem } from "@mui/material";
import TabPanel from "./TabPanel";
import { useMessages } from "@renderer/contexts/MessageContext";
import { SWITCH_PANEL_TAB, TAB_PANEL_CHANGED, TAB_PANEL_CLICK, TAB_PANEL_LENGTH, TabPanelChangedMessage, TabPanelClickMessage, TabPanelLengthMessage } from "../../app/Messages";

export interface TabStructure {
    itemID: string;
    label: React.ReactNode;
    content: React.ReactNode;
    buttons?: React.ReactNode;
}

const StyledTabsPanel = styled(Stack, {
    name: "TabsPanel",
    slot: "root",
})(() => ({
    position: "relative",
    flexDirection: "column",
    height: "100%",
    width: "100%",
}));

const StyledTabsHeader = styled(Box, {
    name: "TabsPanel",
    slot: "header",
})(() => ({
    flex: 0,
}));

const StyledTabsContent = styled(Box, {
    name: "TabsPanel",
    slot: "content",
})(() => ({
    flex: 1,
}));

export interface TabsPanelProps extends React.ComponentProps<typeof Stack> {
}

interface TabsPanelOwnProps extends TabsPanelProps {
    buttons?: React.ReactNode;
    tabPosition?: "top" | "bottom";
    onMove?: (draggedItemID: string, targetItemID: string) => void;
    onActivate?: (activeTabID: string) => void;
}

export const TabsPanel: React.FC<TabsPanelOwnProps> = (props) => {
    const {
        children, buttons, className, tabPosition = "top",
        onMove, onActivate, ...other
    } = useThemeProps({ name: "TabsPanel", props: props });
    const { queueMessage, subscribe, unsubscribe } = useMessages();

    const [activeTab, setActiveTab] = React.useState(0);
    const [tabs, setTabs] = React.useState<React.ReactElement<React.ComponentProps<typeof TabPanel>>[]>([]);
    const [tabsMap, setTabsMap] = React.useState<Map<string, TabStructure>>(new Map());
    const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
    const sourceDragIndexRef = React.useRef<number | null>(null);

    const [tabSwitcherOpen, setTabSwitcherOpen] = React.useState(false);
    const [tabSwitcherIndex, setTabSwitcherIndex] = React.useState(0);

    const rootRef = React.useRef<HTMLDivElement | null>(null);
    const tabsListRef = React.useRef<HTMLDivElement | null>(null);
    const tabSwitcherStartIndexRef = React.useRef(0);
    const tabSwitcherOpenRef = React.useRef(false);
    const tabSwitcherIndexRef = React.useRef(0);

    React.useEffect(() => {
        tabSwitcherOpenRef.current = tabSwitcherOpen;
    }, [tabSwitcherOpen]);

    React.useEffect(() => {
        tabSwitcherIndexRef.current = tabSwitcherIndex;
    }, [tabSwitcherIndex]);

    const handleWheel = (event: React.WheelEvent) => {
        if (tabsListRef.current) {
            tabsListRef.current.scrollLeft += event.deltaY;
        }
    };

    const activateTab = React.useCallback((index: number) => {
        if (index < 0 || index >= tabs.length) {
            return;
        }
        setActiveTab(index);
        onActivate?.(tabs[index].props.itemID!);
    }, [tabs, onActivate]);

    const isFocusInsideTabsPanel = React.useCallback(() => {
        const root = rootRef.current;
        const activeElement = document.activeElement;
        return !!root && !!activeElement && root.contains(activeElement);
    }, []);

    const openOrMoveTabSwitcher = React.useCallback((direction: 1 | -1) => {
        if (tabs.length < 2) {
            return;
        }

        const baseIndex = tabSwitcherOpenRef.current ? tabSwitcherIndexRef.current : activeTab;
        const nextIndex = (baseIndex + direction + tabs.length) % tabs.length;

        if (!tabSwitcherOpenRef.current) {
            tabSwitcherStartIndexRef.current = activeTab;
        }

        setTabSwitcherIndex(nextIndex);
        setTabSwitcherOpen(true);
    }, [tabs.length, activeTab]);

    const commitTabSwitcher = React.useCallback(() => {
        if (!tabSwitcherOpenRef.current) {
            return;
        }

        const targetTab = tabs[tabSwitcherIndexRef.current];
        if (!targetTab) {
            setTabSwitcherOpen(false);
            return;
        }

        queueMessage(SWITCH_PANEL_TAB, other.itemID, targetTab.props.itemID);

        setTabSwitcherOpen(false);
    }, [tabs, queueMessage, other.itemID]);

    const cancelTabSwitcher = React.useCallback(() => {
        setTabSwitcherIndex(tabSwitcherStartIndexRef.current);
        setTabSwitcherOpen(false);
    }, []);

    React.useEffect(() => {
        const validatedTabs = React.Children.toArray(children).map((child) => {
            if (!React.isValidElement(child) || child.type !== TabPanel) {
                throw new Error("TabsPanel children must be of type TabPanel.");
            }
            if (!(child as React.ReactElement<React.ComponentProps<typeof TabPanel>>).props.itemID) {
                throw new Error("TabsPanel children must have an itemID prop.");
            }
            return child as React.ReactElement<React.ComponentProps<typeof TabPanel>>;
        });

        setTabs(validatedTabs);

        const tabsStructures = new Map<string, TabStructure>();
        validatedTabs.forEach((tab) => {
            const itemID = tab.props.itemID;
            let content = tab.props.content;
            if (React.isValidElement(content)) {
                content = React.cloneElement(
                    content as React.ReactElement<{ itemID: string, tabsItemID: string }>,
                    { itemID: tab.props.itemID, tabsItemID: other.itemID }
                );
            }
            let label = tab.props.label;
            if (React.isValidElement(label)) {
                label = React.cloneElement(
                    label as React.ReactElement<{ itemID: string, tabsItemID: string }>,
                    { itemID: tab.props.itemID, tabsItemID: other.itemID }
                );
            }
            let buttons = tab.props.buttons;
            if (React.isValidElement(buttons)) {
                buttons = React.cloneElement(
                    buttons as React.ReactElement<{ itemID: string, tabsItemID: string }>,
                    { itemID: tab.props.itemID, tabsItemID: other.itemID }
                );
            }
            tabsStructures.set(itemID!, {
                itemID: itemID!,
                label: label,
                content: content,
                buttons: buttons
            });
        });
        setTabsMap(tabsStructures);
    }, [children, other.itemID]);

    React.useEffect(() => {
        if (activeTab >= tabs.length) {
            setActiveTab(Math.max(0, tabs.length - 1));
        }
        if (tabSwitcherIndex >= tabs.length) {
            setTabSwitcherIndex(Math.max(0, tabs.length - 1));
        }
        if (tabs.length < 2 && tabSwitcherOpen) {
            setTabSwitcherOpen(false);
        }
        queueMessage(TAB_PANEL_LENGTH, { tabsItemID: other.itemID, length: tabs.length } as TabPanelLengthMessage);
    }, [tabs.length, activeTab, tabSwitcherIndex, tabSwitcherOpen, queueMessage, other.itemID]);

    React.useEffect(() => {
        if (activeTab !== null && activeTab < tabs.length) {
            const selectedTab = tabs[activeTab];
            if (React.isValidElement(selectedTab)) {
                queueMessage(TAB_PANEL_CHANGED, { tabsItemID: other.itemID, itemID: selectedTab.props.itemID } as TabPanelChangedMessage);
            }
        }
    }, [activeTab, tabs, other.itemID, queueMessage]);

    const handleTabClick = (index: number) => {
        queueMessage(TAB_PANEL_CLICK, { itemID: tabs[index].props.itemID, tabsItemID: other.itemID } as TabPanelClickMessage);
    };

    React.useEffect(() => {
        const handleSwitchTabMessage = (tabsItemID: string, itemID: string) => {
            if (tabsItemID === other.itemID) {
                const tabIndex = tabs.findIndex((tab) => tab.props.itemID === itemID);
                if (tabIndex >= 0) {
                    activateTab(tabIndex);
                }
            }
        };

        subscribe(SWITCH_PANEL_TAB, handleSwitchTabMessage);
        return () => {
            unsubscribe(SWITCH_PANEL_TAB, handleSwitchTabMessage);
        };
    }, [tabs, subscribe, unsubscribe, other.itemID]);

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            const focusInside = isFocusInsideTabsPanel();

            if (!tabSwitcherOpenRef.current && !focusInside) {
                return;
            }

            if (event.key === "Tab" && event.ctrlKey) {
                event.preventDefault();
                event.stopPropagation();
                openOrMoveTabSwitcher(event.shiftKey ? -1 : 1);
                return;
            }

            if (!tabSwitcherOpenRef.current) {
                return;
            }

            if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                cancelTabSwitcher();
                return;
            }

            if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();
                commitTabSwitcher();
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (!tabSwitcherOpenRef.current) {
                return;
            }

            if (event.key === "Control") {
                event.preventDefault();
                event.stopPropagation();
                commitTabSwitcher();
            }
        };

        window.addEventListener("keydown", handleKeyDown, true);
        window.addEventListener("keyup", handleKeyUp, true);

        return () => {
            window.removeEventListener("keydown", handleKeyDown, true);
            window.removeEventListener("keyup", handleKeyUp, true);
        };
    }, [isFocusInsideTabsPanel, openOrMoveTabSwitcher, cancelTabSwitcher, commitTabSwitcher]);

    const handleDragStart = (event: React.DragEvent, sourceIndex: number) => {
        sourceDragIndexRef.current = sourceIndex;
        event.dataTransfer.effectAllowed = "move";

        const tabElement = event.currentTarget as HTMLElement;
        const dragImage = tabElement.cloneNode(true) as HTMLElement;
        dragImage.style.position = "absolute";
        dragImage.style.top = "-9999px";
        dragImage.style.left = "-9999px";
        document.body.appendChild(dragImage);

        event.dataTransfer.setDragImage(dragImage, 0, 0);
        setTimeout(() => document.body.removeChild(dragImage), 0);
    };

    const handleDragOver = (event: React.DragEvent, targetIndex: number) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setDragOverIndex(targetIndex);
    };

    const handleDrop = (event: React.DragEvent, targetIndex: number) => {
        event.preventDefault();

        if (sourceDragIndexRef.current !== null && onMove && sourceDragIndexRef.current !== targetIndex) {
            const sourceTab = tabs[sourceDragIndexRef.current];
            const targetTab = tabs[targetIndex];
            onMove(sourceTab.props.itemID!, targetTab.props.itemID!);
        }

        sourceDragIndexRef.current = null;
        setDragOverIndex(null);
    };

    const tabHeader = (
        <StyledTabsHeader
            className={`TabsPanel-header ${tabPosition === "top" ? "position-top" : "position-bottom"}`}
            sx={{ zIndex: 10 }}
        >
            <Paper sx={{ display: "flex", flexDirection: "row" }}>
                {buttons}
                <Tabs
                    value={activeTab < tabs.length ? activeTab : 0}
                    onChange={(_event, newValue: number) => {
                        activateTab(newValue);
                    }}
                    aria-label="Tabs Panel"
                    variant="scrollable"
                    scrollButtons="auto"
                    slotProps={{
                        indicator: {
                            sx: {
                                bottom: tabPosition === "top" ? 0 : undefined,
                                top: tabPosition === "bottom" ? 0 : undefined,
                            },
                        },
                        list: {
                            sx: {
                                marginTop: tabPosition === "bottom" ? 2 : undefined,
                                minWidth: "100%",
                            }
                        },
                        scroller: {
                            ref: tabsListRef,
                            onWheel: handleWheel,
                        },
                        scrollButtons: {
                            sx: {
                                display: "none",
                            },
                        },
                    }}
                >
                    {tabs.map((tab, index) => (
                        <Tab
                            itemID={tab.props.itemID}
                            key={tab.props.itemID}
                            aria-label="Tab"
                            label={tabsMap.get(tab.props.itemID!)?.label ?? ""}
                            onClick={() => handleTabClick(index)}
                            draggable={onMove !== undefined}
                            onDragStart={(event) => handleDragStart(event, index)}
                            onDragOver={(event) => handleDragOver(event, index)}
                            onDrop={(event) => handleDrop(event, index)}
                        />
                    ))}
                </Tabs>
                <Box flexGrow={1} />
                {tabs.map((tab, index) => (
                    <Box
                        key={tab.props.itemID}
                        sx={{
                            alignSelf: "center",
                        }}
                        hidden={activeTab !== index}
                    >
                        {tabsMap.get(tab.props.itemID!)?.buttons}
                    </Box>
                ))}
            </Paper>
        </StyledTabsHeader>
    );

    return (
        <StyledTabsPanel
            ref={rootRef}
            className={`TabsPanel-root ${className ?? ""}`}
            {...other}
        >
            {tabPosition === "top" && tabHeader}

            {tabSwitcherOpen && tabs.length > 1 && (
                <Paper
                    sx={{
                        position: "absolute",
                        top: tabPosition === "top" ? 52 : 16,
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 1400,
                        minWidth: 320,
                        maxWidth: 520,
                        width: "40%",
                        pointerEvents: "none",
                    }}
                >
                    <List
                        aria-label="Tab switcher"
                    >
                        {tabs.map((tab, index) => (
                            <ListItem
                                key={tab.props.itemID}
                                disablePadding
                            >
                                <Box
                                    sx={{
                                        width: "100%",
                                        px: 8,
                                        py: 4,
                                        borderRadius: 1,
                                        bgcolor: index === tabSwitcherIndex ? "action.selected" : undefined,
                                        color: index === tabSwitcherIndex ? "text.primary" : "text.secondary",
                                        fontWeight: index === tabSwitcherIndex ? 600 : 400,
                                        overflow: "hidden",
                                        whiteSpace: "nowrap",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {tabsMap.get(tab.props.itemID!)?.label ?? ""}
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                </Paper>
            )}

            <StyledTabsContent
                className="TabsPanel-content"
                style={{ minHeight: 0 }}
            >
                {tabs.map((tab, index) => (
                    <Box
                        key={tab.props.itemID}
                        sx={{
                            height: "100%",
                        }}
                        hidden={activeTab !== index}
                    >
                        {tabsMap.get(tab.props.itemID!)?.content}
                    </Box>
                ))}
            </StyledTabsContent>

            {tabPosition === "bottom" && tabHeader}
        </StyledTabsPanel>
    );
};

export default TabsPanel;