import React from "react";
import { Box, useTheme, useThemeProps } from "@mui/material";
import { ITabLabelSlot, resolveReactNodeFactory } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import { resolveIcon } from "@renderer/themes/icons";

interface TabLabelSlotProps extends Omit<React.ComponentProps<typeof Box>, "slot"> {
}

interface TabLabelSlotOwnProps extends TabLabelSlotProps {
    slot: ITabLabelSlot;
    ref?: React.Ref<HTMLDivElement>;
    tabsItemID?: string;
}

const TabLabelSlot: React.FC<TabLabelSlotOwnProps> = (props) => {
    const { slot, ref, tabsItemID, itemID, className, ...other } = useThemeProps({ name: "TabLabelSlot", props });
    const theme = useTheme();
    const [label, setLabel] = React.useState<React.ReactNode | null>(null);
    const [icon, setIcon] = React.useState<React.ReactNode | null>(null);
    const [refresh, setRefresh] = React.useState(false);
    const { registerRefresh, refreshSlot } = useRefreshSlot();

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

    return (
        <TabPanelLabel ref={ref} tabsItemID={tabsItemID} itemID={itemID}>
            {icon}
            {label}
        </TabPanelLabel>
    );
};

export default TabLabelSlot;