import React from "react";
import { ITabSlot, ITabsSlot, resolveBooleanFactory, resolveStringFactory, resolveTabSlotsFactory, resolveToolBarSlotKindFactory, SlotFactoryContext } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import TabsPanel from "@renderer/components/TabsPanel/TabsPanel";
import TabPanel from "@renderer/components/TabsPanel/TabPanel";
import { createTabPanel } from "./helpers";
import { useMessages } from "@renderer/contexts/MessageContext";
import { SWITCH_PANEL_TAB } from "@renderer/app/Messages";
import ToolBarSlot from "./ToolBarSlot";
import { useTheme } from "@mui/material";

interface TabsSlotProps {
}

interface TabsSlotOwnProps extends TabsSlotProps {
    slot: ITabsSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const TabsSlot: React.FC<TabsSlotOwnProps> = (props) => {
    const theme = useTheme();
    const { slot, ref } = props;
    const [tabs, setTabs] = React.useState<React.ReactElement<React.ComponentProps<typeof TabPanel>>[]>([]);
    const [toolBar, setToolBar] = React.useState<React.ReactNode>(null);
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [, reRender] = React.useState<bigint>(0n);
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const { queueMessage } = useMessages();
    const slotContext: SlotFactoryContext = React.useMemo(() => ({ theme, refresh: refreshSlot }), [theme, refreshSlot]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, (redraw) => {
            if (redraw === "only") {
                reRender(prev => prev + 1n);
            } else {
                setRefresh(prev => prev + 1n);
            }
        });
        slot?.onMount?.(slotContext);
        return () => {
            unregisterRefresh();
            slot?.onUnmount?.(slotContext);
        };
    }, [slot.id]);

    React.useEffect(() => {
        const tabs: ITabSlot[] = [];
        const resolvedTabSlots = resolveTabSlotsFactory(slot.tabs, slotContext);
        if (resolvedTabSlots) {
            const defaultTabId = resolveStringFactory(slot.defaultTabId, slotContext) || resolvedTabSlots[0]?.id || null;
            setTabs(resolvedTabSlots.map((tab: ITabSlot) => {
                const contentRef = React.createRef<HTMLDivElement>();
                const labelRef = React.createRef<HTMLDivElement>();
                const toolBarRef = React.createRef<HTMLDivElement>();
                const { panel } = createTabPanel(
                    tab,
                    () => {
                        setTabs(prevTabs => prevTabs.filter(t => t.props.itemID !== tab.id));
                        tab.onClose?.(slotContext);
                    },
                    () => {
                        // const pinnedTab = tab.pin!();
                        // setTabs(prevTabs => [...prevTabs, pinnedTab]);
                        // TODO: implement pinning
                        tab.onPin?.(slotContext);
                    },
                    slotContext,
                    contentRef,
                    labelRef,
                    toolBarRef
                );
                if (panel) {
                    tab.onMount?.(slotContext);
                    tabs.push(tab);
                    if (defaultTabId && tab.id === defaultTabId) {
                        queueMessage(SWITCH_PANEL_TAB, slot.id, defaultTabId);
                    }
                    return panel;
                }
                return null;
            }).filter(Boolean) as React.ReactElement<React.ComponentProps<typeof TabPanel>>[]);
        } else {
            setTabs([]);
        }
        const resolvedToolBarSlot = resolveToolBarSlotKindFactory(slot.toolBar, slotContext);
        if (resolvedToolBarSlot) {
            setToolBar(<ToolBarSlot slot={resolvedToolBarSlot} />);
        } else {
            setToolBar(null);
        }
        return () => {
            tabs.forEach(tab => {
                tab.onUnmount?.(slotContext);
            });
        };
    }, [slot.tabs, slot.toolBar, refresh]);

    return (
        <TabsPanel
            key={slot.id}
            itemID={slot.id}
            ref={ref}
            className="TabsSlot-root"
            tabPosition={slot.position}
            buttons={toolBar}
        >
            {tabs}
        </TabsPanel>
    );
};

export default TabsSlot;