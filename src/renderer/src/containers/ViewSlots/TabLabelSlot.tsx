import React from "react";
import { Box, useTheme, useThemeProps } from "@mui/material";
import { ITabLabelSlot, ITabSlot, resolveBooleanFactory, resolveReactNodeFactory, SlotRuntimeContext } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import { resolveIcon } from "@renderer/themes/icons";
import { useMessages } from "@renderer/contexts/MessageContext";
import { TAB_PANEL_CHANGED, TabPanelChangedMessage } from "@renderer/app/Messages";
import { TabCloseButton } from "@renderer/components/TabsPanel/TabCloseButton";
import { TabPinButton } from "@renderer/components/TabsPanel/TabPinButton";

interface TabLabelSlotProps {
}

interface TabLabelSlotOwnProps extends TabLabelSlotProps {
    tabSlot: ITabSlot;
    slot: ITabLabelSlot;
    ref?: React.Ref<HTMLDivElement>;
    tabsItemID?: string;
    itemID?: string;
    onClose?: () => void;
    onPin?: () => void;
    pinned?: boolean;
}

const TabLabelSlot: React.FC<TabLabelSlotOwnProps> = (props) => {
    const { tabSlot, slot, ref, tabsItemID, itemID, onClose, onPin, pinned, ...other } = useThemeProps({ name: "TabLabelSlot", props });
    const theme = useTheme();
    const [label, setLabel] = React.useState<React.ReactNode | null>(null);
    const [icon, setIcon] = React.useState<React.ReactNode | null>(null);
    const { registerRefresh, refreshSlot, openDialog } = useViewSlot();
    const { subscribe, unsubscribe } = useMessages();
    const [active, setActive] = React.useState(false);
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [, reRender] = React.useState<bigint>(0n);
    const runtimeContext: SlotRuntimeContext = React.useMemo(() => ({ theme, refresh: refreshSlot, openDialog }), [theme, refreshSlot, openDialog]);

    const closable = resolveBooleanFactory(tabSlot.closable, runtimeContext);
    const pinnable = resolveBooleanFactory(tabSlot.pinnable, runtimeContext);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, (redraw) => {
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
    }, [slot.id]);

    React.useEffect(() => {
        if (active) {
            slot?.onActivate?.(runtimeContext);
        } else {
            slot?.onDeactivate?.();
        }
    }, [active]);

    React.useEffect(() => {
        setIcon(resolveIcon(theme, slot.icon));
        setLabel(resolveReactNodeFactory(slot.label, runtimeContext) ?? "");
    }, [slot.icon, slot.label, refresh]);

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
        <TabPanelLabel ref={ref} tabsItemID={tabsItemID} itemID={itemID} {...other}>
            {icon}
            {pinned && (<theme.icons.Pinned color="primary" />)}
            {label}
            {closable && onClose !== undefined && (
                <TabCloseButton
                    onClick={onClose}
                    active={active}
                />
            )}
            {pinnable && onPin !== undefined && (
                <TabPinButton
                    onClick={onPin}
                    active={active}
                />
            )}
        </TabPanelLabel>
    );
};

export default TabLabelSlot;