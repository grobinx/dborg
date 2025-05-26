import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import {
    ContentSlotKindFactory,
    resolveContentSlotKindFactory,
    resolveReactNodeFactory,
    resolveTabLabelKindFactory,
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

export function createContentComponent(
    slot: ContentSlotKindFactory,
    refreshSlot: (id: string) => void,
    ref: React.Ref<HTMLDivElement>,
): React.ReactNode {
    const resolvedContent = resolveContentSlotKindFactory(slot, refreshSlot);
    if (resolvedContent) {
        if (resolvedContent.type === "grid") {
            return (
                <GridSlot
                    slot={resolvedContent}
                    ref={ref}
                />
            );
        } else if (resolvedContent.type === "content") {
            return (
                <ContentSlot
                    slot={resolvedContent}
                    ref={ref}
                />
            );
        } else if (resolvedContent.type === "tabs") {
            return (
                <TabsSlot
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
    slot: TabLabelSlotKindFactory,
    refreshSlot: (id: string) => void,
    ref: React.Ref<HTMLDivElement>
): React.ReactNode {
    const resolvedLabel = resolveTabLabelKindFactory(slot, refreshSlot);
    if (resolvedLabel) {
        if (resolvedLabel.type === "tablabel") {
            return (
                <TabLabelSlot
                    slot={resolvedLabel}
                    ref={ref}
                />
            );
        }
        else if (resolvedLabel.type === "rendered") {
            return (
                <RenderedSlot
                    slot={resolvedLabel}
                    ref={ref}
                />
            );
        }
    }
    return null;
}