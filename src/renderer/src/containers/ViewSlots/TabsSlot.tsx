import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import ActionButton from "@renderer/components/CommandPalette/ActionButton";
import { resolveIcon } from "@renderer/themes/icons";
import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import TabPanelButtons from "@renderer/components/TabsPanel/TabPanelButtons";
import { styled, useThemeProps } from "@mui/material/styles";
import { ITabSlot, ITabsSlot, ITitleSlot, resolveActionIdsFactory, resolveContentSlotKindFactory, resolveReactNodeFactory, resolveTabLabelFactory, resolveTabSlotsFactory } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import TabsPanel from "@renderer/components/TabsPanel/TabsPanel";
import TabPanel, { TabPanelOwnProps } from "@renderer/components/TabsPanel/TabPanel";
import { createContentComponent, createTabLabel } from "./helpers";

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

    React.useEffect(() => {
        const resolvedTabSlots = resolveTabSlotsFactory(slot.tabs, refreshSlot);
        if (resolvedTabSlots) {
            setTabs(resolvedTabSlots.map((tab: ITabSlot) => {
                const contentRef = React.createRef<HTMLDivElement>();
                const content = createContentComponent(tab.content, refreshSlot, contentRef);
                const labelRef = React.createRef<HTMLDivElement>();
                const label = createTabLabel(tab.label, refreshSlot, theme, labelRef);
                if (content && label) {
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
        const unregister = registerRefresh(slot.id, () => {
            setTimeout(() => {
                setRefresh(prev => !prev);
            }, 0);
        });
        return unregister;
    }, [slot.id]);

    return (
        <TabsPanel
            itemID={slot.id}
            className="TabsSlot-root"
        >
            {tabs}
        </TabsPanel>
    );
};

export default TabsSlot;