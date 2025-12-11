import React from "react";
import { ITabSlot, ITabsSlot, resolveBooleanFactory, resolveStringFactory, resolveTabSlotsFactory, resolveToolBarSlotKindFactory } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import TabsPanel from "@renderer/components/TabsPanel/TabsPanel";
import TabPanel from "@renderer/components/TabsPanel/TabPanel";
import { createTabContent, createTabLabel } from "./helpers";
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
    const [refresh, setRefresh] = React.useState(false);
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const { queueMessage } = useMessages();19

    React.useEffect(() => {
        slot?.onMount?.(refreshSlot);
        return () => {
            slot?.onUnmount?.(refreshSlot);
        };
    }, [slot]);

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
                if (content && label) {
                    if (defaultTabId && tab.id === defaultTabId) {
                        queueMessage(SWITCH_PANEL_TAB, slot.id, defaultTabId);
                    }
                    const resolvedToolBarSlot = resolveToolBarSlotKindFactory(tab.toolBar, refreshSlot);
                    return (
                        <TabPanel
                            key={tab.id}
                            itemID={tab.id}
                            label={label}
                            buttons={resolvedToolBarSlot ? <ToolBarSlot slot={resolvedToolBarSlot} actionSlotId={tab.actionSlotId} /> : undefined}
                            content={content}
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

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setRefresh(prev => !prev);
        });
        return unregisterRefresh;
    }, [slot.id]);

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