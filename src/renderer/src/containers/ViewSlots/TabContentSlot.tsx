import React from "react";
import { Box, useTheme, useThemeProps } from "@mui/material";
import { ITabContentSlot, ITabLabelSlot, resolveContentSlotFactory, resolveReactNodeFactory } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import { resolveIcon } from "@renderer/themes/icons";
import ToolButton from "@renderer/components/ToolButton";
import { useMessages } from "@renderer/contexts/MessageContext";
import { SQL_EDITOR_CLOSE } from "../Connections/ConnectionView/EdiorsTabs";
import { TAB_PANEL_CHANGED, TabPanelChangedMessage } from "@renderer/app/Messages";
import { createContentComponent } from "./helpers";
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
        node: React.ReactNode
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [refresh, setRefresh] = React.useState(false);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const { subscribe, unsubscribe, sendMessage } = useMessages();
    const [active, setActive] = React.useState(false);

    React.useEffect(() => {
        setContent(prev => ({
            ...prev,
            node: createContentComponent(slot.content!, refreshSlot, prev.ref)
        }));
    }, [slot.content, refresh]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            if (active) {
                setRefresh(prev => !prev);
            } else {
                setPendingRefresh(true);
            }
        });
        return unregisterRefresh;
    }, [slot.id, active]);

    React.useEffect(() => {
        if (active && pendingRefresh) {
            setRefresh(prev => !prev);
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
            {content.node}
        </TabPanelContent>
    );
};

export default TabContentSlot;