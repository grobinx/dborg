import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import {
    ToolFactory,
    ContentSlotKindFactory,
    resolveActionsFactory,
    resolveContentSlotKindFactory,
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
    isTextField,
    isNumberField,
    isSelectField,
    isAutoRefresh,
    isCopyData,
    resolveToolBarSlotsKindFactory,
    ToolBarSlotsKindFactory,
    ITabSlot,
    resolveBooleanFactory,
    isSearchField,
    ProgressBarSlotFactory,
    resolveProgressBarFactory,
    isTextSlot,
    SlotRuntimeContext,
    isBooleanField,
} from "../../../../../plugins/manager/renderer/CustomSlots";
import React from "react";
import GridSlot from "./GridSlot";
import ContentSlot, { ContentSlotContext } from "./ContentSlot";
import RenderedSlot from "./RenderedSlot";
import TabLabelSlot from "./TabLabelSlot";
import TabsSlot from "./TabsSlot";
import TabContentSlot, { TabContentSlotContext } from "./TabContentSlot";
import TitleSlot from "./TitleSlot";
import TextSlot from "./TextSlot";
import SplitSlot from "./SplitSlot";
import { ActionManager, isAction, isActions } from "@renderer/components/CommandPalette/ActionManager";
import { CommandManager, isCommandDescriptor } from "@renderer/components/CommandPalette/CommandManager";
import { useRefSlot } from "./RefSlotContext";
import { ToolButton } from "@renderer/components/buttons/ToolButton";
import EditorSlot from "./EditorSlot";
import ButtonGroup from "@renderer/components/buttons/ButtonGroup";
import { ToolBooleanField, ToolNumberField, ToolSearchField, ToolSelectedField, ToolTextField } from "./components/ToolFields";
import { ToolAutoRefreshBar } from "./components/ToolAutoRefreshBar";
import { ToolCopyDataButton } from "./components/ToolCopyDataButton";
import TabPanel from "@renderer/components/TabsPanel/TabPanel";
import ProgressBarSlot from "./ProgressBarSlot";
import ColumnSlot from "./ColumnSlot";
import RowSlot from "./RowSlot";
import { ToolBarSlots } from "./ToolBarSlot";

export function createContentComponent(
    slot: ContentSlotKindFactory,
    runtimeContext: SlotRuntimeContext,
    ref?: React.Ref<HTMLDivElement>,
): React.ReactNode {
    const resolvedContent = resolveContentSlotKindFactory(slot, runtimeContext);
    if (resolvedContent) {
        switch (resolvedContent.type) {
            case "grid":
                return <GridSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
            case "content":
                return <ContentSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
            case "tabs":
                return <TabsSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
            case "rendered":
                return <RenderedSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
            case "split":
                return <SplitSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
            case "editor":
                return <EditorSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
            case "column":
                return <ColumnSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
            case "row":
                return <RowSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
            case "title":
                return <TitleSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
            case "text":
                return <TextSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
        }
    }
    return null;
}

export function createTabLabel(
    tabSlot: ITabSlot,
    slot: TabLabelSlotKindFactory,
    runtimeContext: SlotRuntimeContext,
    ref: React.Ref<HTMLDivElement>,
    onClose?: () => void,
    onPin?: () => void,
    pinned?: boolean,
): React.ReactNode {
    const resolvedLabel = resolveTabLabelKindFactory(slot, runtimeContext);
    if (resolvedLabel) {
        if (resolvedLabel.type === "tablabel") {
            return <TabLabelSlot key={resolvedLabel.id} tabSlot={tabSlot} slot={resolvedLabel} ref={ref} onClose={onClose} onPin={onPin} pinned={pinned} />;
        } else if (resolvedLabel.type === "rendered") {
            return <RenderedSlot key={resolvedLabel.id} slot={resolvedLabel} ref={ref} />;
        }
    }
    return null;
}

export function createTabContent(
    slot: TabContentSlotKindFactory,
    runtimeContext: SlotRuntimeContext,
    ref: React.Ref<HTMLDivElement>,
): React.ReactNode {
    const resolvedContent = resolveTabContentSlotKindFactory(slot, runtimeContext);
    if (resolvedContent) {
        if (resolvedContent.type === "tabcontent") {
            return <TabContentSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
        }
        else if (resolvedContent.type === "rendered") {
            return <RenderedSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
        }
    }
    return null;
}

export function createTabPanel(
    slot: ITabSlot,
    onClose: (() => void) | undefined,
    onPin: (() => void) | undefined,
    runtimeContext: SlotRuntimeContext,
    contentRef: React.Ref<HTMLDivElement>,
    labelRef: React.Ref<HTMLDivElement>,
    toolBarRef: React.Ref<HTMLDivElement>,
    pinned?: boolean,
): {
    content: React.ReactNode,
    label: React.ReactNode,
    toolBar: React.ReactNode,
    panel: React.ReactElement<React.ComponentProps<typeof TabPanel>>,
} {
    const content = createTabContent(slot.content, runtimeContext, contentRef);
    const label = createTabLabel(slot, slot.label, runtimeContext, labelRef, onClose, onPin, pinned);
    const toolBar = createTabToolbar(slot.toolBar, runtimeContext, toolBarRef);
    let panel: React.ReactNode = null;
    if (content && label) {
        panel = (
            <TabPanel
                key={slot.id}
                itemID={slot.id}
                content={content}
                label={label}
                buttons={toolBar}
            />
        );
    }
    return {
        content,
        label,
        toolBar,
        panel: panel as React.ReactElement<React.ComponentProps<typeof TabPanel>>,
    }
}

export function createTabToolbar(
    slot: ToolBarSlotsKindFactory | undefined,
    runtimeContext: SlotRuntimeContext,
    ref: React.Ref<HTMLDivElement>,
): React.ReactNode {
    const resolvedContent = resolveToolBarSlotsKindFactory(slot, runtimeContext);
    if (resolvedContent) {
        return <ToolBarSlots slot={resolvedContent} ref={ref} />
    }
    return null;
}

export function createTitleContent(
    slot: TitleSlotKindFactory,
    runtimeContext: SlotRuntimeContext,
    ref: React.Ref<HTMLDivElement>,
): React.ReactNode {
    const resolvedContent = resolveTitleSlotKindFactory(slot, runtimeContext);
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
    runtimeContext: SlotRuntimeContext,
    ref: React.Ref<HTMLDivElement>,
): React.ReactNode {
    const resolvedContent = resolveTextSlotKindFactory(slot, runtimeContext);
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
    runtimeContext: SlotRuntimeContext,
    ref?: React.Ref<HTMLDivElement>,
): React.ReactNode | null {
    const resolvedPart = resolveSplitSlotPartKindFactory(part, runtimeContext);
    if (resolvedPart) {
        if (resolvedPart.type === "content") {
            return <ContentSlot key={resolvedPart.id} slot={resolvedPart} ref={ref} />;
        } else if (resolvedPart.type === "split") {
            return <SplitSlot key={resolvedPart.id} slot={resolvedPart} ref={ref} />;
        } else if (resolvedPart.type === "tabs") {
            return <TabsSlot key={resolvedPart.id} slot={resolvedPart} ref={ref} />;
        } else if (resolvedPart.type === "grid") {
            return <GridSlot key={resolvedPart.id} slot={resolvedPart} ref={ref} />;
        } else if (resolvedPart.type === "rendered") {
            return <RenderedSlot key={resolvedPart.id} slot={resolvedPart} ref={ref} />;
        } else if (resolvedPart.type === "editor") {
            return <EditorSlot key={resolvedPart.id} slot={resolvedPart} ref={ref} />;
        } else if (resolvedPart.type === "column") {
            return <ColumnSlot key={resolvedPart.id} slot={resolvedPart} ref={ref} />;
        } else if (resolvedPart.type === "row") {
            return <RowSlot key={resolvedPart.id} slot={resolvedPart} ref={ref} />;
        }
    }
    return null;
}

export function createProgressBarContent(
    slot: ProgressBarSlotFactory,
    runtimeContext: SlotRuntimeContext,
    ref: React.Ref<HTMLDivElement>,
    absolute?: boolean,
): React.ReactNode {
    const resolvedContent = resolveProgressBarFactory(slot, runtimeContext);
    if (resolvedContent) {
        if (resolvedContent.type === "progress") {
            return <ProgressBarSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} absolute={absolute} />;
        }
    }
    return null;
}

export function createActionComponents(
    actions: ToolFactory | undefined,
    actionSlotId: string | undefined,
    getRefSlot: ReturnType<typeof useRefSlot>["getRefSlot"],
    runtimeContext: SlotRuntimeContext,
) {
    let actionComponents: React.ReactNode[] = [];
    let actionManager: (() => ActionManager<any>) | null = null;
    let commandManager: CommandManager<any> | null = null;
    let actionContext: any = null;

    const resolvedActions = resolveActionsFactory(actions, runtimeContext);
    if (resolvedActions) {
        if (actionSlotId) {
            const dataGridRef = getRefSlot<DataGridActionContext<any>>(actionSlotId, "datagrid");
            if (dataGridRef) {
                actionManager = () => (dataGridRef.current?.actionManager()!);
                actionContext = dataGridRef.current;
            }
            else {
                const tabContentRef = getRefSlot<TabContentSlotContext>(actionSlotId, "tabcontent");
                if (tabContentRef) {
                    actionManager = () => (tabContentRef.current?.actionManager()!);
                    actionContext = tabContentRef.current;
                }
                else {
                    const contentRef = getRefSlot<ContentSlotContext>(actionSlotId, "content");
                    if (contentRef) {
                        actionManager = () => (contentRef.current?.actionManager()!);
                        actionContext = contentRef.current;
                    }
                    else {
                        const editorRef = getRefSlot<ContentSlotContext>(actionSlotId, "editor");
                        if (editorRef) {
                            actionManager = () => (editorRef.current?.actionManager()!);
                            actionContext = editorRef.current;
                        }
                    }
                }
            }
        }

        actionComponents = resolvedActions.map((action, index) => {
            if (typeof action === "object") {
                if (isActions(action)) {
                    if (!actionManager) {
                        const actionManagerRef = new ActionManager<any>();
                        actionManager = () => actionManagerRef!;
                    }
                    return (
                        <ButtonGroup key={index}>
                            {Object.values(action).map((groupAction) => {
                                if (actionManager) {
                                    actionManager().registerAction(groupAction);
                                    return (
                                        <ToolButton
                                            key={groupAction.id}
                                            action={groupAction}
                                            actionContext={() => actionContext}
                                            actionManager={actionManager!}
                                            size="small"
                                        />
                                    );
                                }
                            })}
                        </ButtonGroup>
                    );
                }
                if (isAction(action)) {
                    if (!actionManager) {
                        const actionManagerRef = new ActionManager<any>();
                        actionManager = () => actionManagerRef!;
                    }
                    actionManager().registerAction(action);
                    return (
                        <ToolButton
                            key={action.id}
                            action={action}
                            actionContext={() => actionContext}
                            actionManager={actionManager}
                            size="small"
                        />
                    );
                }

                if (isSearchField(action)) {
                    return (
                        <ToolSearchField
                            key={index}
                            action={action}
                            runtimeContext={runtimeContext}
                        />
                    );
                } else if (isTextField(action)) {
                    return (
                        <ToolTextField
                            key={index}
                            action={action}
                            runtimeContext={runtimeContext}
                        />
                    );
                } else if (isNumberField(action)) {
                    return (
                        <ToolNumberField
                            key={index}
                            action={action}
                            runtimeContext={runtimeContext}
                        />
                    );
                } else if (isSelectField(action)) {
                    return (
                        <ToolSelectedField
                            key={index}
                            action={action}
                            runtimeContext={runtimeContext}
                        />
                    );
                } else if (isBooleanField(action)) {
                    return (
                        <ToolBooleanField
                            key={index}
                            action={action}
                            runtimeContext={runtimeContext}
                        />
                    );
                } else if (isAutoRefresh(action)) {
                    return (
                        <ToolAutoRefreshBar
                            key={index}
                            action={action}
                            runtimeContext={runtimeContext}
                        />
                    );
                } else if (isCopyData(action)) {
                    return (
                        <ToolCopyDataButton
                            key={index}
                            action={action}
                            runtimeContext={runtimeContext}
                        />
                    );
                } else if (isTextSlot(action)) {
                    return (
                        <TextSlot
                            key={action.id}
                            slot={action}
                        />
                    );
                }
            }

            if (isCommandDescriptor(action)) {
                if (!commandManager) {
                    commandManager = new CommandManager();
                }
                commandManager.registerCommand(action);
                return null;
            }

            if (typeof action === "string" && actionContext && actionManager) {
                return (
                    <ToolButton
                        key={action}
                        action={action}
                        actionContext={() => actionContext}
                        actionManager={actionManager}
                        size="small"
                    />
                );
            } else if (Array.isArray(action) && actionContext && actionManager) {
                return (
                    <ButtonGroup key={index}>
                        {action.map((actionId) => (
                            <ToolButton
                                key={actionId}
                                action={actionId}
                                actionContext={() => actionContext}
                                actionManager={actionManager!}
                                size="small"
                            />
                        ))}
                    </ButtonGroup>
                );
            }

            return null
        }).filter(Boolean) as React.ReactNode[];
    }

    return { actionComponents, actionManager, commandManager, actionContext };
}

export const cidFactory = (futureId: string, uniqueId?: string) => {
    if (uniqueId) {
        return (...parts: (string)[]) => `${futureId}-${parts.join("-")}-${uniqueId}`;
    }
    return (...parts: (string)[]) => `${futureId}-${parts.join("-")}`;
};
