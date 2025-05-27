import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import ActionButton from "@renderer/components/CommandPalette/ActionButton";
import { resolveIcon } from "@renderer/themes/icons";
import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { styled, useThemeProps } from "@mui/material/styles";
import { ITabSlot, ITabsSlot, ITitleSlot, resolveActionIdsFactory, resolveBooleanFactory, resolveContentSlotKindFactory, resolveReactNodeFactory, resolveStringFactory, resolveTabLabelKindFactory, resolveTabSlotsFactory } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import TabsPanel from "@renderer/components/TabsPanel/TabsPanel";
import TabPanel, { TabPanelOwnProps } from "@renderer/components/TabsPanel/TabPanel";
import { createContentComponent, createTabContent, createTabLabel } from "./helpers";
import TabPanelContent from "@renderer/components/TabsPanel/TabPanelContent";
import { useMessages } from "@renderer/contexts/MessageContext";
import { SWITCH_PANEL_TAB } from "@renderer/app/Messages";

interface TabsSlotProps extends Omit<React.ComponentProps<typeof Box>, "slot"> {
}

interface TabsSlotOwnProps extends TabsSlotProps {
    slot: ITabsSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const StyledTabsSlot = styled(Box)(() => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 4,
    paddingLeft: 4,
}));

const TabsSlot: React.FC<TabsSlotOwnProps> = (props) => {
    const { slot, ref, className, ...other } = useThemeProps({ name: "TabsSlot", props });
    const theme = useTheme();
    const { t } = useTranslation();
    const [tabs, setTabs] = React.useState<React.ReactElement<React.ComponentProps<typeof TabPanel>>[]>([]);
    const [refresh, setRefresh] = React.useState(false);
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const { queueMessage } = useMessages();

    React.useEffect(() => {
        const resolvedTabSlots = resolveTabSlotsFactory(slot.tabs, refreshSlot);
        if (resolvedTabSlots) {
            const defaultTabId = resolveStringFactory(slot.defaultTabId, refreshSlot) || resolvedTabSlots[0]?.id || null;
            setTabs(resolvedTabSlots.map((tab: ITabSlot, index) => {
                const contentRef = React.createRef<HTMLDivElement>();
                const content = createTabContent(tab.content, refreshSlot, contentRef);
                const labelRef = React.createRef<HTMLDivElement>();
                const closeable = resolveBooleanFactory(tab.closable, refreshSlot);
                const label = createTabLabel(tab.label, refreshSlot, labelRef, closeable ? () => {
                    setTabs(prevTabs => prevTabs.filter(t => t.props.itemID !== tab.id));
                } : undefined);
                if (content && label) {
                    if (defaultTabId && tab.id === defaultTabId) {
                        queueMessage(SWITCH_PANEL_TAB, slot.id, defaultTabId);
                    }
                    return (
                        <TabPanel
                            key={tab.id}
                            itemID={tab.id}
                            label={label}
                            content={content}
                        />
                    );
                }
                return null;
            }).filter(Boolean) as React.ReactElement<React.ComponentProps<typeof TabPanel>>[]);
        } else {
            setTabs([]);
        }
    }, [slot.tabs, refresh]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setRefresh(prev => !prev);
        });
        return unregisterRefresh;
    }, [slot.id]);

    return (
        <TabsPanel
            itemID={slot.id}
            className="TabsSlot-root"
            tabPosition={slot.position}
        >
            {tabs}
        </TabsPanel>
    );
};

export default TabsSlot;