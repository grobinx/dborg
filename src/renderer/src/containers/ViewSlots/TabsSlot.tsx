import React from "react";
import { ITabSlot, ITabsSlot, resolveBooleanFactory, resolveStringFactory, resolveTabSlotsFactory, resolveToolBarSlotKindFactory } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import TabsPanel from "@renderer/components/TabsPanel/TabsPanel";
import TabPanel from "@renderer/components/TabsPanel/TabPanel";
import { createTabContent, createTabLabel, createTabToolbar } from "./helpers";
import { useMessages } from "@renderer/contexts/MessageContext";
import { SWITCH_PANEL_TAB } from "@renderer/app/Messages";
import ToolBarSlot from "./ToolBarSlot";

interface TabsSlotProps {
}

interface TabsSlotOwnProps extends TabsSlotProps {
    slot: ITabsSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const TabsSlot: React.FC<TabsSlotOwnProps> = (props) => {
    const { slot, ref } = props;
    const [tabs, setTabs] = React.useState<React.ReactElement<React.ComponentProps<typeof TabPanel>>[]>([]);
    const [toolBar, setToolBar] = React.useState<React.ReactNode>(null);
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const { queueMessage } = useMessages();

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setRefresh(prev => prev + 1n);
        });
        slot?.onMount?.(refreshSlot);
        return () => {
            unregisterRefresh();
            slot?.onUnmount?.(refreshSlot);
        };
    }, [slot.id]);

    React.useEffect(() => {
        const resolvedTabSlots = resolveTabSlotsFactory(slot.tabs, refreshSlot);
        if (resolvedTabSlots) {
            const defaultTabId = resolveStringFactory(slot.defaultTabId, refreshSlot) || resolvedTabSlots[0]?.id || null;
            setTabs(resolvedTabSlots.map((tab: ITabSlot) => {
                const contentRef = React.createRef<HTMLDivElement>();
                const content = createTabContent(tab.content, refreshSlot, contentRef);
                const closeable = resolveBooleanFactory(tab.closable, refreshSlot);
                const labelRef = React.createRef<HTMLDivElement>();
                const label = createTabLabel(tab.label, refreshSlot, labelRef, closeable ? () => {
                    setTabs(prevTabs => prevTabs.filter(t => t.props.itemID !== tab.id));
                } : undefined);
                const toolBarRef = React.createRef<HTMLDivElement>();
                const toolBar = createTabToolbar(tab.toolBar, refreshSlot, toolBarRef);
                if (content && label) {
                    if (defaultTabId && tab.id === defaultTabId) {
                        queueMessage(SWITCH_PANEL_TAB, slot.id, defaultTabId);
                    }
                    return (
                        <TabPanel
                            key={tab.id}
                            itemID={tab.id}
                            content={content}
                            label={label}
                            buttons={toolBar}
                        />
                    );
                }
                return null;
            }).filter(Boolean) as React.ReactElement<React.ComponentProps<typeof TabPanel>>[]);
        } else {
            setTabs([]);
        }
        const resolvedToolBarSlot = resolveToolBarSlotKindFactory(slot.toolBar, refreshSlot);
        if (resolvedToolBarSlot) {
            setToolBar(<ToolBarSlot slot={resolvedToolBarSlot} />);
        } else {
            setToolBar(null);
        }
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