import { DataGridActionContext } from "@renderer/components/DataGrid/DataGridTypes";
import {
    ToolFactory,
    ContentSlotKindFactory,
    isIField,
    resolveActionsFactory,
    resolveBooleanFactory,
    resolveContentSlotKindFactory,
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
    isTextField,
    isNumberField,
    isSelectField,
    ISelectField,
    ITextField,
    INumberField,
    IAutoRefresh,
    AutoRefreshLifecycle,
    IAutoRefreshContext,
    isAutoRefresh,
} from "../../../../../plugins/manager/renderer/CustomSlots";
import React from "react";
import GridSlot from "./GridSlot";
import ContentSlot from "./ContentSlot";
import RenderedSlot from "./RenderedSlot";
import TabLabelSlot from "./TabLabelSlot";
import TabsSlot from "./TabsSlot";
import TabContentSlot from "./TabContentSlot";
import TitleSlot from "./TitleSlot";
import TextSlot from "./TextSlot";
import SplitSlot from "./SplitSlot";
import { ActionManager, isAction } from "@renderer/components/CommandPalette/ActionManager";
import { CommandManager, isCommandDescriptor } from "@renderer/components/CommandPalette/CommandManager";
import { useRefSlot } from "./RefSlotContext";
import { ToolButton } from "@renderer/components/buttons/ToolButton";
import { TextField } from "@renderer/components/inputs/TextField";
import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import Tooltip from "@renderer/components/Tooltip";
import { NumberField } from "@renderer/components/inputs/NumberField";
import { SelectField } from "@renderer/components/inputs/SelectField";
import { AutoRefreshBar, AutoRefreshInterval, AutoRefreshState } from "@renderer/components/AutoRefreshBar";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import EditorSlot from "./EditorSlot";

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
        } else if (resolvedContent.type === "editor") {
            return <EditorSlot key={resolvedContent.id} slot={resolvedContent} ref={ref} />;
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
        } else if (resolvedPart.type === "grid") {
            return <GridSlot key={resolvedPart.id} slot={resolvedPart} ref={ref} />;
        } else if (resolvedPart.type === "rendered") {
            return <RenderedSlot key={resolvedPart.id} slot={resolvedPart} ref={ref} />;
        } else if (resolvedPart.type === "editor") {
            return <EditorSlot key={resolvedPart.id} slot={resolvedPart} ref={ref} />;
        }
    }
    return null;
}

const ToolSelectedField: React.FC<{action: ISelectField, refreshSlot: (id: string) => void }> = (props) => {
    const {
        action,
        refreshSlot,
    } = props;

    const [value, setValue] = React.useState<any | undefined>(action.defaultValue);

    return (
        <InputDecorator indicator={false} disableBlink>
            <SelectField
                placeholder={action.placeholder}
                value={value}
                onChange={setValue}
                onChanged={action.onChange}
                disabled={resolveBooleanFactory(action.disabled, refreshSlot)}
                size="small"
                width={action.width}
                options={resolveSelectOptionsFactory(action.options, refreshSlot) || []}
                tooltip={action.tooltip}
            />
        </InputDecorator>
    );
};

const ToolTextField: React.FC<{ action: ITextField, refreshSlot: (id: string) => void }> = (props) => {
    const {
        action,
        refreshSlot,
    } = props;

    const [value, setValue] = React.useState<string>(action.defaultValue ?? "");

    return (
        <InputDecorator indicator={false} disableBlink>
            <TextField
                placeholder={action.placeholder}
                value={value}
                onChange={setValue}
                onChanged={action.onChange}
                disabled={resolveBooleanFactory(action.disabled, refreshSlot)}
                size="small"
                width={action.width}
                minLength={action.minLength}
                maxLength={action.maxLength}
                tooltip={action.tooltip}
            />
        </InputDecorator>
    );
};

const ToolNumberField: React.FC<{ action: INumberField, refreshSlot: (id: string) => void }> = (props) => {
    const {
        action,
        refreshSlot,
    } = props;

    const [value, setValue] = React.useState<number | null>(action.defaultValue ?? action.min ?? null);

    return (
        <InputDecorator indicator={false} disableBlink>
            <NumberField
                placeholder={action.placeholder}
                value={value}
                onChange={value => setValue(value ?? null)}
                onChanged={value => action.onChange(value ?? action.defaultValue ?? action.min ?? null)}
                disabled={resolveBooleanFactory(action.disabled, refreshSlot)}
                size="small"
                width={action.width}
                min={action.min}
                max={action.max}
                step={action.step}
                tooltip={action.tooltip}
            />
        </InputDecorator>
    );
};

const ToolAutoRefreshBar: React.FC<{ action: IAutoRefresh, refreshSlot: (id: string) => void }> = (props) => {
    const {
        action,
        refreshSlot,
    } = props;
    const lifecycle: AutoRefreshLifecycle = {
        onHide: "pause",
        onShow: "resume",
        ...action.lifecycle,
    }
    const [executing, setExecuting] = React.useState<boolean>(false);
    const [state, setState] = React.useState<AutoRefreshState>(lifecycle.onMount === "start" ? "running" : "stopped");
    const prevState = React.useRef<AutoRefreshState>(state);
    const [interval, setInterval] = React.useState<AutoRefreshInterval>(action.defaultInterval ?? 5);
    const [barRef, isBarVisible] = useVisibleState<HTMLDivElement>();

    React.useEffect(() => {
        action.onMount?.(refreshSlot, context);
        return () => {
            action.onUnmount?.(refreshSlot, context);
        }
    }, []);

    React.useEffect(() => {
        if (isBarVisible) {
            if (lifecycle.onShow === "start" && prevState.current === "stopped") {
                setState("running");
            } else if (lifecycle.onShow === "resume" && prevState.current === "paused") {
                setState("running");
            }
            action.onShow?.(refreshSlot, context);
        } else {
            if (lifecycle.onHide === "stop" && prevState.current === "running") {
                setState("stopped");
            } else if (lifecycle.onHide === "pause" && prevState.current === "running") {
                setState("paused");
            }
            action.onHide?.(refreshSlot, context);
        }
    }, [isBarVisible]);

    React.useEffect(() => {
        if (state === "running" && action.clearOn === "start" && prevState.current === "stopped") {
            action.onClear?.(refreshSlot, context);
        }
        if (state === "stopped" && action.clearOn === "stop" && prevState.current === "running") {
            action.onClear?.(refreshSlot, context);
        }
        prevState.current = state;
    }, [state]);

    const context: IAutoRefreshContext = {
        state,
        interval,
        executing,
        start: () => setState("running"),
        stop: () => setState("stopped"),
        pause: () => setState("paused"),
        resume: () => setState("running"),
        clear: () => action.onClear?.(refreshSlot, context),
        setState,
        setInterval,
        setExecuting,
    };

    return (
        <AutoRefreshBar
            ref={barRef}
            state={state}
            interval={interval}
            onStateChange={setState}
            onIntervalChange={setInterval}
            onStart={action.onStart ? () => action.onStart?.(refreshSlot, context) : undefined}
            onPause={action.onPause ? () => action.onPause?.(refreshSlot, context) : undefined}
            onResume={action.onResume ? () => action.onResume?.(refreshSlot, context) : undefined}
            onClear={action.onClear ? () => action.onClear?.(refreshSlot, context) : undefined}
            onStop={action.onStop ? () => action.onStop?.(refreshSlot, context) : undefined}
            onTick={action.onTick ? () => action.onTick?.(refreshSlot, context) : undefined}
            executing={context.executing}
            canClear={action.canClear}
            canPause={action.canPause}
            canRefresh={action.canRefresh}
        />
    );
};

export function createActionComponents(
    actions: ToolFactory | undefined,
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
                    return (
                        <ToolButton
                            key={action.id}
                            action={action}
                            actionContext={() => context}
                            actionManager={actionManager}
                            size="small"
                        />
                    );
                }

                if (isTextField(action)) {
                    return (
                        <ToolTextField
                            key={index}
                            action={action}
                            refreshSlot={refreshSlot}
                        />
                    );
                } else if (isNumberField(action)) {
                    return (
                        <ToolNumberField
                            key={index}
                            action={action}
                            refreshSlot={refreshSlot}
                        />
                    );
                } else if (isSelectField(action)) {
                    return (
                        <ToolSelectedField
                            key={index}
                            action={action}
                            refreshSlot={refreshSlot}
                        />
                    );
                } else if (isAutoRefresh(action)) {
                    return (
                        <ToolAutoRefreshBar
                            key={index}
                            action={action}
                            refreshSlot={refreshSlot}
                        />
                    );
                }
            }

            if (isCommandDescriptor(action)) {
                if (!commandManager) {
                    commandManager = new CommandManager<typeof context>();
                }
                commandManager.registerCommand(action);
                return null;
            }

            if (typeof action === "string" && dataGridRef?.current) {
                return <ToolButton
                    key={action}
                    action={action}
                    actionContext={() => dataGridRef?.current}
                    actionManager={dataGridRef.current.actionManager() ?? undefined}
                    size="small"
                />;
            }

            return null
        }).filter(Boolean) as React.ReactNode[];
    }

    return { actionComponents, actionManager, commandManager, actionContext };
}