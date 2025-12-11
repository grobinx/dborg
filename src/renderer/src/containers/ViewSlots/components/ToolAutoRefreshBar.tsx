import React from "react";
import { AutoRefreshLifecycle, IAutoRefresh, IAutoRefreshContext } from "../../../../../../plugins/manager/renderer/CustomSlots";
import { AutoRefreshBar, AutoRefreshInterval, AutoRefreshState } from "@renderer/components/AutoRefreshBar";
import { useVisibleState } from "@renderer/hooks/useVisibleState";

export const ToolAutoRefreshBar: React.FC<{ action: IAutoRefresh, refreshSlot: (id: string) => void }> = (props) => {
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
            if (lifecycle.onShow === "start") {
                setState("running");
            } else if (lifecycle.onShow === "resume") {
                setState("running");
            } else if (lifecycle.onShow === "ignore") {
                // no action
            }
            action.onShow?.(refreshSlot, context);
        } else {
            if (lifecycle.onHide === "stop") {
                setState("stopped");
            } else if (lifecycle.onHide === "pause") {
                setState("paused");
            } else if (lifecycle.onHide === "ignore") {
                // no action
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

    React.useEffect(() => {
        if (lifecycle.onMount === "start") {
            setState("running");
        }
        action.onMount?.(refreshSlot, context);
        return () => {
            if (lifecycle.onUnmount === "stop") {
                setState("stopped");
            }
            action.onUnmount?.(refreshSlot, context);
        }
    }, []);

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

