import React from "react";
import { styled, Box, Tabs, Tab, useThemeProps, AppBar, Stack, Menu, MenuItem } from "@mui/material";
import TabPanel from "./TabPanel";
import { useMessages } from "@renderer/contexts/MessageContext";
import { SWITCH_PANEL_TAB, TAB_PANEL_CHANGED, TAB_PANEL_CLICK, TAB_PANEL_LENGTH, TabPanelChangedMessage, TabPanelClickMessage, TabPanelLengthMessage } from "../../app/Messages";
import { CommandManager } from "../CommandPalette/CommandManager";

export interface TabStructure {
    itemID: string;
    label: React.ReactNode;
    content: React.ReactNode;
    buttons?: React.ReactNode;
}

export interface TabsActionContext {
    activeTabID: string | undefined;
    getCount: () => number;
    getTab: (tabID: string | number) => TabStructure | undefined;
    setActiveTab: (tabID: string) => void;
}

// Styled TabsPanel root container
const StyledTabsPanel = styled(Stack, {
    name: "TabsPanel",
    slot: "root",
})(() => ({
    flexDirection: "column",
    height: "100%",
    width: "100%",
}));

// Styled Tabs header
const StyledTabsHeader = styled(Box, {
    name: "TabsPanel",
    slot: "header",
})(() => ({
    flex: 0,
}));

// Styled Tabs content area
const StyledTabsContent = styled(Box, {
    name: "TabsPanel",
    slot: "content",
})(() => ({
    flex: 1,
}));

export interface TabsPanelProps extends React.ComponentProps<typeof StyledTabsPanel> {
    slotProps?: {
        header?: React.ComponentProps<typeof StyledTabsHeader>;
        content?: React.ComponentProps<typeof StyledTabsContent>;
        tabs?: React.ComponentProps<typeof Tabs>;
        tab?: React.ComponentProps<typeof Tab>;
    };
}

interface TabsPanelOwnProps extends TabsPanelProps {
    buttons?: React.ReactNode;
    tabPosition?: "top" | "bottom";
    onMove?: (draggedItemID: string, targetItemID: string) => void;
}

export const TabsPanel: React.FC<TabsPanelOwnProps> = (props) => {
    const {
        children, buttons, slotProps, className, tabPosition = "top", 
        onMove, ...other
    } = useThemeProps({ name: "TabsPanel", props: props });
    const { queueMessage, subscribe, unsubscribe } = useMessages();

    const [activeTab, setActiveTab] = React.useState(0);
    const [contentHeight, setContentHeight] = React.useState<string | number>("auto");
    const [tabs, setTabs] = React.useState<React.ReactElement<React.ComponentProps<typeof TabPanel>>[]>([]);
    const [tabsMap, setTabsMap] = React.useState<Map<string, TabStructure>>(new Map());
    const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
    const sourceDragIndexRef = React.useRef<number | null>(null);

    const headerRef = React.useRef<HTMLDivElement>(null);
    const tabsListRef = React.useRef<HTMLDivElement | null>(null);

    const tabsActionContext: TabsActionContext = {
        activeTabID: tabs[activeTab]?.props.itemID,
        getCount: () => tabsMap.size,
        getTab: (tabID) => {
            return typeof tabID === "string" ? tabsMap.get(tabID) : tabsMap.get(tabs[tabID].props.itemID!);
        },
        setActiveTab: (tabID) => {
            const index = tabs.findIndex((tab) => tab.props.itemID === tabID);
            if (index !== -1) {
                setActiveTab(index);
            }
        }
    };

    const handleWheel = (event: React.WheelEvent) => {
        if (tabsListRef.current) {
            tabsListRef.current.scrollLeft += event.deltaY;
        }
    };

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
    }, [children]);

    React.useEffect(() => {
        if (activeTab >= tabs.length) {
            setActiveTab(Math.max(0, tabs.length - 1));
        }
        queueMessage(TAB_PANEL_LENGTH, { tabsItemID: other.itemID, length: tabs.length } as TabPanelLengthMessage);
    }, [tabs.length]);

    React.useEffect(() => {
        if (activeTab !== null && activeTab < tabs.length) {
            const selectedTab = tabs[activeTab];
            if (React.isValidElement(selectedTab)) {
                queueMessage(TAB_PANEL_CHANGED, { tabsItemID: other.itemID, itemID: selectedTab.props.itemID } as TabPanelChangedMessage);
            }
        }
    }, [activeTab, tabs, other.itemID]);

    const handleTabClick = (index: number) => {
        queueMessage(TAB_PANEL_CLICK, { itemID: tabs[index].props.itemID, tabsItemID: other.itemID } as TabPanelClickMessage);
    };

    React.useEffect(() => {
        const handleSwitchTabMessage = (tabsItemID: string, itemID: string) => {
            if (tabsItemID === other.itemID) {
                const tabIndex = tabs.findIndex((tab) => tab.props.itemID === itemID);
                if (tabIndex >= 0) {
                    setActiveTab(tabIndex);
                }
            }
        };

        subscribe(SWITCH_PANEL_TAB, handleSwitchTabMessage);
        return () => {
            unsubscribe(SWITCH_PANEL_TAB, handleSwitchTabMessage);
        };
    }, [tabs]);

    React.useEffect(() => {
        const observer = new ResizeObserver(() => {
            if (headerRef.current) {
                const headerHeight = headerRef.current.offsetHeight;
                setContentHeight(`calc(100% - ${headerHeight}px)`);
            }
        });

        if (headerRef.current) {
            observer.observe(headerRef.current);
        }

        return () => {
            if (headerRef.current) {
                observer.unobserve(headerRef.current);
            }
        };
    }, [tabPosition]);

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
            ref={headerRef}
            className={`TabsPanel-header ${tabPosition === "top" ? "position-top" : "position-bottom"}`}
            sx={{ zIndex: 3 }}
            {...slotProps?.header}
        >
            <AppBar position="static" sx={{ flexDirection: "row" }}>
                {buttons}
                <Tabs
                    value={activeTab < tabs.length ? activeTab : 0}
                    onChange={(_event, newValue: number) => setActiveTab(newValue)}
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
                {tabsMap.get(tabs[activeTab]?.props.itemID!)?.buttons}
            </AppBar>
        </StyledTabsHeader>
    );

    return (
        <StyledTabsPanel className={`TabsPanel-root ${className ?? ''}`} {...other}>
            {tabPosition === "top" && tabHeader}

            <StyledTabsContent
                className="TabsPanel-content"
                style={{ height: contentHeight }}
                {...slotProps?.content}
            >
                {tabs.map((tab, index) => (
                    <Box
                        key={tab.props.itemID}
                        sx={{
                            height: "100%",
                        }}
                        hidden={activeTab !== index}
                    >
                        {tabsMap.get(tab.props.itemID!)?.content ?? null}
                    </Box>
                ))}
            </StyledTabsContent>

            {tabPosition === "bottom" && tabHeader}
        </StyledTabsPanel>
    );
};

export default TabsPanel;