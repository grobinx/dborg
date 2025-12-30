import React from "react";
import { Box, useThemeProps } from "@mui/material";
import { ITabContentSlot } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import { useMessages } from "@renderer/contexts/MessageContext";
import { TAB_PANEL_CHANGED, TabPanelChangedMessage } from "@renderer/app/Messages";
import { createContentComponent, createProgressBarContent } from "./helpers";
import TabPanelContent from "@renderer/components/TabsPanel/TabPanelContent";

interface TabContentSlotProps extends Omit<React.ComponentProps<typeof Box>, "slot"> {
}

interface TabContentSlotOwnProps extends TabContentSlotProps {
    slot: ITabContentSlot;
    ref?: React.Ref<HTMLDivElement>;
    tabsItemID?: string;
    onClose?: () => void;
}

const TabContentSlot: React.FC<TabContentSlotOwnProps> = (props) => {
    const { slot, ref, tabsItemID, itemID, className, onClose, ...other } = useThemeProps({ name: "TabLabelSlot", props });
    const [content, setContent] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode,
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [progressBar, setProgressBar] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const { subscribe, unsubscribe } = useMessages();
    const [active, setActive] = React.useState(false);
    const wasActiveRef = React.useRef(false);
    const previousRefreshRef = React.useRef(refresh);
    const [, reRender] = React.useState<bigint>(0n);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, (redraw) => {
            if (redraw === "only") {
                reRender(prev => prev + 1n);
            } else {
                setPendingRefresh(true);
            }
        });
        return unregisterRefresh;
    }, [slot.id]);

    React.useEffect(() => {
        slot?.onMount?.(refreshSlot);
        return () => {
            slot?.onUnmount?.(refreshSlot);
        };
    }, [slot.id]);

    React.useEffect(() => {
        if (active && pendingRefresh) {
            setRefresh(prev => prev + 1n);
            setPendingRefresh(false);
        }
    }, [active, pendingRefresh]);
    
    React.useEffect(() => {
        if (active) {
            slot?.onActivate?.(refreshSlot);
        } else {
            slot?.onDeactivate?.(refreshSlot);
        }
    }, [active]);

    React.useEffect(() => {
        const isFirstActivation = active && !wasActiveRef.current;
        const refreshChanged = refresh !== previousRefreshRef.current;

        if (isFirstActivation || (active && refreshChanged)) {
            console.debug("TabContentSlot updating content for slot:", slot.id, refresh);
            setContent(prev => ({
                ...prev,
                node: createContentComponent(slot.content!, refreshSlot, prev.ref),
            }));
            setProgressBar(prev => ({
                ...prev,
                node: slot.progress ? createProgressBarContent(slot.progress, refreshSlot, prev.ref) : null,
            }));
            previousRefreshRef.current = refresh;
        }
        if (active) {
            wasActiveRef.current = true;
        }
    }, [active, slot.content, refresh]);

    React.useEffect(() => {
        if (active && pendingRefresh) {
            setRefresh(prev => prev + 1n);
            setPendingRefresh(false);
        }
    }, [active, pendingRefresh]);

    React.useEffect(() => {
        const handleTabPanelChangedMessage = (message: TabPanelChangedMessage) => {
            if (tabsItemID === message.tabsItemID) {
                const newActive = message.itemID === itemID;
                if (newActive !== active) {
                    setActive(newActive);
                }
            }
        };

        subscribe(TAB_PANEL_CHANGED, handleTabPanelChangedMessage);
        return () => {
            unsubscribe(TAB_PANEL_CHANGED, handleTabPanelChangedMessage);
        };
    }, [tabsItemID, itemID, active]);

    return (
        <TabPanelContent ref={ref} tabsItemID={tabsItemID} itemID={itemID}>
            {progressBar.node}
            {content.node}
        </TabPanelContent>
    );
};

export default TabContentSlot;