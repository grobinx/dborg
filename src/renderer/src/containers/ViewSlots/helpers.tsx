import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import { 
    ContentSlotKindFactory, 
    resolveContentSlotKindFactory, 
    resolveReactNodeFactory, 
    resolveTabLabelFactory, 
    TabLabelFactory 
} from "../../../../../plugins/manager/renderer/CustomSlots";
import React from "react";
import GridSlot from "./GridSlot";
import ContentSlot from "./ContentSlot";
import RenderedSlot from "./RenderedSlot";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import { Theme } from "@mui/material";
import { resolveIcon } from "@renderer/themes/icons";

export function createContentComponent(
    slot: ContentSlotKindFactory,
    refreshSlot: (id: string) => void,
    ref: React.Ref<HTMLDivElement>,
    dataGridRef?: React.RefObject<DataGridActionContext<any> | null>
): React.ReactNode {
    const resolvedContent = resolveContentSlotKindFactory(slot, refreshSlot);
    if (resolvedContent) {
        if (resolvedContent.type === "grid") {
            return (
                <GridSlot
                    slot={resolvedContent}
                    ref={ref}
                    dataGridRef={dataGridRef}
                />
            );
        } else if (resolvedContent.type === "content") {
            return (
                <ContentSlot
                    slot={resolvedContent}
                    ref={ref}
                />
            );
        } else if (resolvedContent.type === "rendered") {
            return (
                <RenderedSlot
                    slot={resolvedContent}
                    ref={ref}
                />
            );
        }
    }
    return null;
}

export function createTabLabel(
    slot: TabLabelFactory,
    refreshSlot: (id: string) => void,
    theme: Theme,
    ref: React.Ref<HTMLDivElement>
): React.ReactNode {
    const resolvedLabel = resolveTabLabelFactory(slot, refreshSlot);
    if (resolvedLabel) {
        return (
            <TabPanelLabel ref={ref}>
                {resolveIcon(theme, resolvedLabel?.icon)}
                {resolveReactNodeFactory(resolvedLabel?.label, refreshSlot)}
            </TabPanelLabel>
        );
    }
    return null;
}