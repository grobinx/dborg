import React from "react";
import {
    SlotRuntimeContext,
    IDialogTabs,
    IDialogTab,
    resolveStringFactory,
    resolveDialogTabsFactory,
    resolveDialogLayoutItemsKindFactory,
} from "../../../../../../plugins/manager/renderer/CustomSlots";
import { DialogLayoutItem } from "./DialogLayoutItem";
import TabsPanel from "@renderer/components/TabsPanel/TabsPanel";
import TabPanel from "@renderer/components/TabsPanel/TabPanel";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import TabPanelContent from "@renderer/components/TabsPanel/TabPanelContent";
import { uuidv7 } from "uuidv7";

export const DialogTabs: React.FC<{
    dialogTabs: IDialogTabs;
    runtimeContext: SlotRuntimeContext;
    structure: Record<string, any>;
    onChange: (structure: Record<string, any>) => void;
    invalidFields: Set<string>;
    onValidityChange: () => void;
}> = (props) => {
    const {
        dialogTabs,
        runtimeContext,
        structure,
        onChange,
        invalidFields,
        onValidityChange,
    } = props;

    const tabs = resolveDialogTabsFactory(dialogTabs.tabs, runtimeContext) || [];
    const [activeTabId, setActiveTabId] = React.useState<string | null>(tabs[0]?.id || null);
    const tabsId = React.useMemo(() => uuidv7(), [dialogTabs]);

    const handleTabChange = (tabId: string) => {
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
            setActiveTabId(tabId);
            tab.onActivate?.();
        }
    };

    React.useEffect(() => {
        if (tabs.length > 0 && !activeTabId) {
            setActiveTabId(tabs[0].id);
            tabs[0]?.onActivate?.();
        }
    }, [tabs]);

    const tabPanels = tabs.map((tab) => {
        const items = resolveDialogLayoutItemsKindFactory(tab.items, runtimeContext) || [];

        return (
            <TabPanel
                key={tab.id}
                itemID={tab.id}
                label={<TabPanelLabel>{resolveStringFactory(tab.label, runtimeContext) || ""}</TabPanelLabel>}
                content={
                    <TabPanelContent>
                        {items.map((item, itemIndex) => (
                            <DialogLayoutItem
                                key={itemIndex}
                                item={item}
                                runtimeContext={runtimeContext}
                                structure={structure}
                                onChange={onChange}
                                invalidFields={invalidFields}
                                onValidityChange={onValidityChange}
                            />
                        ))}
                    </TabPanelContent>
                }
            />
        );
    });

    return (
        <TabsPanel
            itemID={tabsId}
            tabPosition="top"
            onActivate={handleTabChange}
            sx={{ height: "100%" }}
        >
            {tabPanels}
        </TabsPanel>
    );
};