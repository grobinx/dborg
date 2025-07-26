import React from "react";
import { Box, useTheme, useThemeProps } from "@mui/material";
import { ITabLabelSlot, resolveReactNodeFactory } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import { resolveIcon } from "@renderer/themes/icons";
import ToolButton from "@renderer/components/ToolButton";
import { useMessages } from "@renderer/contexts/MessageContext";
import { SQL_EDITOR_CLOSE } from "../Connections/ConnectionView/EdiorsTabs";
import { TAB_PANEL_CHANGED, TabPanelChangedMessage } from "@renderer/app/Messages";

interface TabLabelSlotProps extends Omit<React.ComponentProps<typeof Box>, "slot"> {
}

interface TabLabelSlotOwnProps extends TabLabelSlotProps {
    slot: ITabLabelSlot;
    ref?: React.Ref<HTMLDivElement>;
    tabsItemID?: string;
    onClose?: () => void;
}

const TabLabelSlot: React.FC<TabLabelSlotOwnProps> = (props) => {
    const { slot, ref, tabsItemID, itemID, className, onClose, ...other } = useThemeProps({ name: "TabLabelSlot", props });
    const theme = useTheme();
    const [label, setLabel] = React.useState<React.ReactNode | null>(null);
    const [icon, setIcon] = React.useState<React.ReactNode | null>(null);
    const [refresh, setRefresh] = React.useState(false);
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const { subscribe, unsubscribe } = useMessages();
    const [active, setActive] = React.useState(false);

    React.useEffect(() => {
        setIcon(resolveIcon(theme, slot.icon));
        setLabel(resolveReactNodeFactory(slot.label, refreshSlot) ?? "");
    }, [slot.icon, slot.label, refresh]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setRefresh(prev => !prev);
        });
        return unregisterRefresh;
    }, [slot.id]);

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
        <TabPanelLabel ref={ref} tabsItemID={tabsItemID} itemID={itemID}>
            {icon}
            {label}
            {onClose !== undefined && (
                <ToolButton
                    color="error"
                    onClick={onClose}
                    size="small"
                    disabled={!active}
                >
                    <theme.icons.Close />
                </ToolButton>
            )}
        </TabPanelLabel>
    );
};

export default TabLabelSlot;