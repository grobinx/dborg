import React from "react";
import { ISplitSlot } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { SplitPanel, SplitPanelGroup, Splitter } from "@renderer/components/SplitPanel";
import { createSplitPartContent } from "./helpers";
import { uuidv7 } from "uuidv7";
import { useSlotRuntimeContext } from "./hooks/useSlotRuntimeContext";

interface SplitSlotProps {
}

interface SplitSlotOwnProps extends SplitSlotProps {
    slot: ISplitSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const SplitSlot: React.FC<SplitSlotOwnProps> = (props) => {
    const { slot, ref } = props;
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const [first, setFirst] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [second, setSecond] = React.useState<{
        ref: React.Ref<HTMLDivElement>,
        node: React.ReactNode
    }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const { registerRefresh } = useViewSlot();
    const [, reRender] = React.useState<bigint>(0n);
    const runtimeContext = useSlotRuntimeContext({});

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slotId, (redraw) => {
            if (redraw === "only") {
                reRender(prev => prev + 1n);
            } else {
                setRefresh(prev => prev + 1n);
            }
        });
        slot?.onMount?.(runtimeContext);
        return () => {
            unregisterRefresh();
            slot?.onUnmount?.(runtimeContext);
        };
    }, [slotId]);

    React.useEffect(() => {
        setFirst(prev => ({
            ...prev,
            node: createSplitPartContent(slot.first, runtimeContext, prev.ref)
        }));
        setSecond(prev => ({
            ...prev,
            node: createSplitPartContent(slot.second, runtimeContext, prev.ref)
        }));
    }, [slot.first, slot.second, refresh]);

    return (
        <SplitPanelGroup
            direction={slot.direction ?? "horizontal"}
            autoSaveId={slot.autoSaveId}
        >
            <SplitPanel>
                {first.node}
            </SplitPanel>
            <Splitter />
            <SplitPanel defaultSize={slot.secondSize ?? 30}>
                {second.node}
            </SplitPanel>
        </SplitPanelGroup>
    );
};

export default SplitSlot;