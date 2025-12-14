import React from "react";
import { AutoRefreshLifecycle, IAutoRefresh, IAutoRefreshContext } from "../../../../../../plugins/manager/renderer/CustomSlots";
import { AutoRefreshBar, AutoRefreshInterval, AutoRefreshState } from "@renderer/components/AutoRefreshBar";
import { useVisibleState } from "@renderer/hooks/useVisibleState";

export const ToolAutoRefreshBar: React.FC<{ action: IAutoRefresh, refreshSlot: (id: string) => void }> = (props) => {
    const { action, refreshSlot } = props;
    const lifecycle: AutoRefreshLifecycle = {
        onHide: "pause",
        onShow: "resume",
        onMount: "stop",
        onUnmount: "stop",
        ...action.lifecycle,
    };
    const [executing, setExecuting] = React.useState<boolean>(false);
    const [state, setState] = React.useState<AutoRefreshState>(lifecycle.onMount === "start" ? "running" : "stopped");
    const prevState = React.useRef<AutoRefreshState>(state);
    const wasRunningBeforeHide = React.useRef<boolean>(state === "running");
    const pausedByHide = React.useRef<boolean>(false); // track pause caused by hide
    const [interval, setInterval] = React.useState<AutoRefreshInterval>(action.defaultInterval ?? 5);
    const [barRef, isBarVisible] = useVisibleState<HTMLDivElement>();

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

    React.useEffect(() => {
        if (lifecycle.onMount === "start") setState("running");
        else setState("stopped");
        action.onMount?.(refreshSlot, context);
        return () => {
            action.onUnmount?.(refreshSlot, context);
        };
    }, []);

    React.useEffect(() => {
        // Guard: never auto-change when stopped (current or previous)
        if (state === "stopped" || prevState.current === "stopped") {
            pausedByHide.current = false;
            wasRunningBeforeHide.current = false;
            if (isBarVisible) action.onShow?.(refreshSlot, context);
            else action.onHide?.(refreshSlot, context);
            return;
        }

        if (!isBarVisible) {
            // Going hidden
            wasRunningBeforeHide.current = (state === "running");
            if (lifecycle.onHide === "stop") {
                pausedByHide.current = false;
                setState("stopped");
                action.onHide?.(refreshSlot, context);
            } else if (lifecycle.onHide === "pause") {
                if (state === "running") {
                    pausedByHide.current = true; // mark pause due to hide
                    setState("paused");
                }
                action.onHide?.(refreshSlot, context);
            } else {
                action.onHide?.(refreshSlot, context);
            }
        } else {
            // Becoming visible
            if (pausedByHide.current && lifecycle.onShow === "resume") {
                pausedByHide.current = false;
                setState("running");
                action.onResume?.(refreshSlot, context);
            } else if (wasRunningBeforeHide.current && lifecycle.onShow === "start") {
                setState("running");
                action.onStart?.(refreshSlot, context);
            } else {
                action.onShow?.(refreshSlot, context);
            }
        }
    }, [isBarVisible, state]);

    React.useEffect(() => {
        if (state === "running" && action.clearOn === "start" && prevState.current === "stopped") {
            action.onClear?.(refreshSlot, context);
        }
        if (state === "stopped" && action.clearOn === "stop" && prevState.current === "running") {
            action.onClear?.(refreshSlot, context);
        }
        prevState.current = state;
    }, [state]);

    return (
        <AutoRefreshBar
            ref={barRef}
            state={state}
            interval={interval}
            intervals={action.intervals}
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

