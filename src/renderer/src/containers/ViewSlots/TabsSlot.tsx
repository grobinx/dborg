import React from "react";
import { ITabSlot, ITabsSlot, resolveBooleanFactory, resolveStringFactory, resolveTabSlotsFactory, resolveToolBarSlotsKindFactory, SlotRuntimeContext } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import TabsPanel from "@renderer/components/TabsPanel/TabsPanel";
import TabPanel from "@renderer/components/TabsPanel/TabPanel";
import { createTabPanel } from "./helpers";
import { useMessages } from "@renderer/contexts/MessageContext";
import { SWITCH_PANEL_TAB } from "@renderer/app/Messages";
import { useTheme } from "@mui/material";
import { uuidv7 } from "uuidv7";
import { useToast } from "@renderer/contexts/ToastContext";
import { useDialogs } from "@toolpad/core";
import { ToolBarSlots } from "./ToolBarSlot";

interface TabsSlotProps {
}

interface TabsSlotOwnProps extends TabsSlotProps {
    slot: ITabsSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const TabsSlot: React.FC<TabsSlotOwnProps> = (props) => {
    const theme = useTheme();
    const { slot, ref } = props;
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const [tabs, setTabs] = React.useState<React.ReactElement<React.ComponentProps<typeof TabPanel>>[]>([]);
    const [toolBar, setToolBar] = React.useState<React.ReactNode>(null);
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [, reRender] = React.useState<bigint>(0n);
    const { registerRefresh, refreshSlot, openDialog } = useViewSlot();
    const { queueMessage } = useMessages();
    const addToast = useToast();
    const { confirm } = useDialogs();
    const runtimeContext: SlotRuntimeContext = React.useMemo(() => ({
        theme, refresh: refreshSlot, openDialog, showNotification: ({ message, severity = "info" }) => {
            addToast(severity, message);
        },
        showConfirmDialog: async ({ message, title, severity, cancelLabel, confirmLabel }) => {
            return confirm(message, { title, severity, okText: confirmLabel, cancelText: cancelLabel });
        },
    }), [theme, refreshSlot, openDialog, addToast, confirm]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slotId, (redraw) => {
            if (redraw === "only") {
                reRender(prev => prev + 1n);
            } else {
                setRefresh(prev => prev + 1n);
            }
        });
        slot?.onMount?.(runtimeContext);
        return () => {
            unregisterRefresh();
            slot?.onUnmount?.(runtimeContext);
        };
    }, [slotId]);

    React.useEffect(() => {
        const tabs: ITabSlot[] = [];
        const resolvedTabSlots = resolveTabSlotsFactory(slot.tabs, runtimeContext);
        if (resolvedTabSlots) {
            const defaultTabId = resolveStringFactory(slot.defaultTabId, runtimeContext) || resolvedTabSlots[0]?.id || null;
            setTabs(resolvedTabSlots.map((tab: ITabSlot) => {
                const contentRef = React.createRef<HTMLDivElement>();
                const labelRef = React.createRef<HTMLDivElement>();
                const toolBarRef = React.createRef<HTMLDivElement>();
                const { panel } = createTabPanel(
                    tab,
                    () => {
                        setTabs(prevTabs => prevTabs.filter(t => t.props.itemID !== tab.id));
                        tab.onClose?.(runtimeContext);
                    },
                    () => {
                        // const pinnedTab = tab.pin!();
                        // setTabs(prevTabs => [...prevTabs, pinnedTab]);
                        // TODO: implement pinning
                        tab.onPin?.(runtimeContext);
                    },
                    runtimeContext,
                    contentRef,
                    labelRef,
                    toolBarRef
                );
                if (panel) {
                    tab.onMount?.(runtimeContext);
                    tabs.push(tab);
                    if (defaultTabId && tab.id === defaultTabId) {
                        queueMessage(SWITCH_PANEL_TAB, slotId, defaultTabId);
                    }
                    return panel;
                }
                return null;
            }).filter(Boolean) as React.ReactElement<React.ComponentProps<typeof TabPanel>>[]);
        } else {
            setTabs([]);
        }
        const resolvedToolBarSlot = resolveToolBarSlotsKindFactory(slot.toolBar, runtimeContext);
        if (resolvedToolBarSlot) {
            setToolBar(<ToolBarSlots slot={resolvedToolBarSlot} />);
        } else {
            setToolBar(null);
        }
        return () => {
            tabs.forEach(tab => {
                tab.onUnmount?.(runtimeContext);
            });
        };
    }, [slot.tabs, slot.toolBar, refresh]);

    return (
        <TabsPanel
            key={slotId}
            itemID={slotId}
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