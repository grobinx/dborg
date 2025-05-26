import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import {
    ContentSlotKindFactory,
    resolveContentSlotKindFactory,
    resolveReactNodeFactory,
    resolveTabContentSlotKindFactory,
    resolveTabLabelKindFactory,
    TabContentSlotKindFactory,
    TabLabelSlotKindFactory,
} from "../../../../../plugins/manager/renderer/CustomSlots";
import React from "react";
import GridSlot from "./GridSlot";
import ContentSlot from "./ContentSlot";
import RenderedSlot from "./RenderedSlot";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import { Theme } from "@mui/material";
import { resolveIcon } from "@renderer/themes/icons";
import TabLabelSlot from "./TabLabelSlot";
import TabsSlot from "./TabsSlot";
import TabContentSlot from "./TabContentSlot";

export function createContentComponent(
    slot: ContentSlotKindFactory,
    refreshSlot: (id: string) => void,
    ref?: React.Ref<HTMLDivElement>,
): React.ReactNode {
    const resolvedContent = resolveContentSlotKindFactory(slot, refreshSlot);
    if (resolvedContent) {
        if (resolvedContent.type === "grid") {
            return (
                <GridSlot
                    key={resolvedContent.id}
                    slot={resolvedContent}
                    ref={ref}
                />
            );
        } else if (resolvedContent.type === "content") {
            return (
                <ContentSlot
                    key={resolvedContent.id}    
                    slot={resolvedContent}
                    ref={ref}
                />
            );
        } else if (resolvedContent.type === "tabs") {
            return (
                <TabsSlot
                    key={resolvedContent.id}
                    slot={resolvedContent}
                    ref={ref}
                />
            );
        } else if (resolvedContent.type === "rendered") {
            return (
                <RenderedSlot
                    key={resolvedContent.id}
                    slot={resolvedContent}
                    ref={ref}
                />
            );
        }
    }
    return null;
}

export function createTabLabel(
    slot: TabLabelSlotKindFactory,
    refreshSlot: (id: string) => void,
    ref: React.Ref<HTMLDivElement>,
    onClose?: () => void,
): React.ReactNode {
    const resolvedLabel = resolveTabLabelKindFactory(slot, refreshSlot);
    if (resolvedLabel) {
        if (resolvedLabel.type === "tablabel") {
            return (
                <TabLabelSlot
                    key={resolvedLabel.id}
                    slot={resolvedLabel}
                    ref={ref}
                    onClose={onClose}
                />
            );
        }
        else if (resolvedLabel.type === "rendered") {
            return (
                <RenderedSlot
                    key={resolvedLabel.id}
                    slot={resolvedLabel}
                    ref={ref}
                />
            );
        }
    }
    return null;
}

export function createTabContent(
    slot: TabContentSlotKindFactory,
    refreshSlot: (id: string) => void,
    ref: React.Ref<HTMLDivElement>,
): React.ReactNode {
    const resolvedContent = resolveTabContentSlotKindFactory(slot, refreshSlot);
    if (resolvedContent) {
        if (resolvedContent.type === "tabcontent") {
            return (
                <TabContentSlot
                    key={resolvedContent.id}
                    slot={resolvedContent}
                    ref={ref}
                />
            );
        }
        else if (resolvedContent.type === "rendered") {
            return (
                <RenderedSlot
                    key={resolvedContent.id}
                    slot={resolvedContent}
                    ref={ref}
                />
            );
        }
    }
    return null;
}