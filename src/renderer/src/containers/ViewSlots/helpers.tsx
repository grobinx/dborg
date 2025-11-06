import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import {
    ActionsFactory,
    ContentSlotKindFactory,
    isITextField,
    resolveActionsFactory,
    resolveBooleanFactory,
    resolveContentSlotKindFactory,
    resolveReactNodeFactory,
    resolveSelectOptionsFactory,
    resolveSplitSlotPartKindFactory,
    resolveTabContentSlotKindFactory,
    resolveTabLabelKindFactory,
    resolveTextSlotKindFactory,
    resolveTitleSlotKindFactory,
    SplitSlotPartKindFactory,
    TabContentSlotKindFactory,
    TabLabelSlotKindFactory,
    TextSlotKindFactory,
    TitleSlotKindFactory,
} from "../../../../../plugins/manager/renderer/CustomSlots";
import React from "react";
import GridSlot from "./GridSlot";
import ContentSlot from "./ContentSlot";
import RenderedSlot from "./RenderedSlot";
import TabPanelLabel from "@renderer/components/TabsPanel/TabPanelLabel";
import { MenuItem, Theme } from "@mui/material";
import { resolveIcon } from "@renderer/themes/icons";
import TabLabelSlot from "./TabLabelSlot";
import TabsSlot from "./TabsSlot";
import TabContentSlot from "./TabContentSlot";
import TitleSlot from "./TitleSlot";
import TextSlot from "./TextSlot";
import SplitSlot from "./SplitSlot";
import { ActionManager, isAction } from "@renderer/components/CommandPalette/ActionManager";
import { CommandManager, isCommandDescriptor } from "@renderer/components/CommandPalette/CommandManager";
import { useRefSlot } from "./RefSlotContext";
import ActionButton from "@renderer/components/CommandPalette/ActionButton";
import ToolTextField from "@renderer/components/ToolTextField";

export function createContentComponent(
    slot: ContentSlotKindFactory,
    refreshSlot: (id: string) => void,
    ref?: React.Ref<HTMLDivElement>,
): React.ReactNode {
    const resolvedContent = resolveContentSlotKindFactory(slot, refreshSlot);
    if (resolvedContent) {
        if (resolvedContent.type === "grid") {
            return <GridSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
        } else if (resolvedContent.type === "content") {
            return <ContentSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
        } else if (resolvedContent.type === "tabs") {
            return <TabsSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
        } else if (resolvedContent.type === "rendered") {
            return <RenderedSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
        } else if (resolvedContent.type === "split") {
            return <SplitSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
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
            return <TabLabelSlot key={resolvedLabel.id} slot={resolvedLabel} ref={ref} onClose={onClose} />;
        } else if (resolvedLabel.type === "rendered") {
            return <RenderedSlot key={resolvedLabel.id} slot={resolvedLabel} ref={ref} />;
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
            return <TabContentSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
        } else if (resolvedContent.type === "rendered") {
            return <RenderedSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
        }
    }
    return null;
}

export function createTitleContent(
    slot: TitleSlotKindFactory,
    refreshSlot: (id: string) => void,
    ref: React.Ref<HTMLDivElement>,
): React.ReactNode {
    const resolvedContent = resolveTitleSlotKindFactory(slot, refreshSlot);
    if (resolvedContent) {
        if (resolvedContent.type === "title") {
            return <TitleSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
        } else if (resolvedContent.type === "rendered") {
            return <RenderedSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
        }
    }
    return null;
}
export function createTextContent(
    slot: TextSlotKindFactory,
    refreshSlot: (id: string) => void,
    ref: React.Ref<HTMLDivElement>,
): React.ReactNode {
    const resolvedContent = resolveTextSlotKindFactory(slot, refreshSlot);
    if (resolvedContent) {
        if (resolvedContent.type === "text") {
            return <TextSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
        } else if (resolvedContent.type === "rendered") {
            return <RenderedSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
        }
    }
    return null;
}

export function createSplitPartContent(
    part: SplitSlotPartKindFactory,
    refreshSlot: (id: string) => void,
    ref?: React.Ref<HTMLDivElement>,
): React.ReactNode | null {
    const resolvedPart = resolveSplitSlotPartKindFactory(part, refreshSlot);
    if (resolvedPart) {
        if (resolvedPart.type === "content") {
            return <ContentSlot key={resolvedPart.id} slot={resolvedPart} ref={ref} />;
        } else if (resolvedPart.type === "split") {
            return <SplitSlot key={resolvedPart.id} slot={resolvedPart} ref={ref} />;
        } else if (resolvedPart.type === "tabs") {
            return <TabsSlot key={resolvedPart.id} slot={resolvedPart} ref={ref} />;
        } else if (resolvedPart.type === "rendered") {
            return <RenderedSlot key={resolvedPart.id} slot={resolvedPart} ref={ref} />;
        }
    }
    return null;
}

export function createActionComponents(
    actions: ActionsFactory | undefined,
    actionSlotId: string | undefined,
    getRefSlot: ReturnType<typeof useRefSlot>["getRefSlot"],
    refreshSlot: (id: string) => void,
    context: any,
) {
    let actionComponents: React.ReactNode[] = [];
    let actionManager: ActionManager<any> | null = null;
    let commandManager: CommandManager<any> | null = null;
    let actionContext: any | null = null;

    const resolvedActions = resolveActionsFactory(actions, refreshSlot);
    if (resolvedActions) {
        let dataGridRef: React.RefObject<DataGridActionContext<any>> | undefined = undefined;
        if (actionSlotId) {
            dataGridRef = getRefSlot<DataGridActionContext<any>>(actionSlotId, "datagrid");
            if (dataGridRef) {
                actionManager = dataGridRef.current?.actionManager() ?? null;
                actionContext = dataGridRef.current;
            }
        }

        actionComponents = resolvedActions.map((action, index) => {
            if (typeof action === "object") {
                if (isAction(action)) {
                    if (!actionManager) {
                        actionManager = new ActionManager<typeof context>();
                    }
                    actionManager.registerAction(action);
                    return <ActionButton
                        key={action.id}
                        actionId={action.id}
                        getContext={() => context}
                        actionManager={actionManager}
                    />;
                }
                if (isITextField(action)) {
                    const options = resolveSelectOptionsFactory(action.options, refreshSlot);
                    return <ToolTextField
                        key={index}
                        type={action.type !== 'select' ? action.type : undefined}
                        select={action.type === 'select' ? true : undefined}
                        placeholder={action.placeholder}
                        defaultValue={action.defaultValue ?? ""}
                        onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                            action.onChange(event.target.value);
                        }}
                        disabled={resolveBooleanFactory(action.disabled, refreshSlot)}
                    >
                        {options?.map((option, optionIndex) => (
                            <MenuItem key={optionIndex} value={option.value}>{option.label}</MenuItem>
                        ))}
                    </ToolTextField>;
                }
                if (isCommandDescriptor(action)) {
                    if (!commandManager) {
                        commandManager = new CommandManager<typeof context>();
                    }
                    commandManager.registerCommand(action);
                    return null;
                }
            }
            if (typeof action === "string" && dataGridRef?.current) {
                return <ActionButton
                    key={action}
                    actionId={action}
                    getContext={() => dataGridRef?.current}
                    actionManager={dataGridRef.current.actionManager() ?? undefined}
                />;
            }
            return null
        }).filter(Boolean) as React.ReactNode[];
    }

    return { actionComponents, actionManager, commandManager, actionContext };
}