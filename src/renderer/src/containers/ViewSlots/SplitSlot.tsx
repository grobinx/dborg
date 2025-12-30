import React from "react";
import { ISplitSlot } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import { SplitPanel, SplitPanelGroup, Splitter } from "@renderer/components/SplitPanel";
import { createSplitPartContent } from "./helpers";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { ImperativePanelGroupHandle } from "react-resizable-panels";

interface SplitSlotProps {
}

interface SplitSlotOwnProps extends SplitSlotProps {
    slot: ISplitSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const SplitSlot: React.FC<SplitSlotOwnProps> = (props) => {
    const { slot, ref } = props;
    const [first, setFirst] = React.useState<{
            ref: React.Ref<HTMLDivElement>,
            node: React.ReactNode
        }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [second, setSecond] = React.useState<{
            ref: React.Ref<HTMLDivElement>,
            node: React.ReactNode
        }>({ ref: React.createRef<HTMLDivElement>(), node: null });
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const [, reRender] = React.useState<bigint>(0n);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, (redraw) => {
            if (redraw === "only") {
                reRender(prev => prev + 1n);
            } else {
                setRefresh(prev => prev + 1n);
            }
        });
        slot?.onMount?.(refreshSlot);
        return () => {
            unregisterRefresh();
            slot?.onUnmount?.(refreshSlot);
        };
    }, [slot.id]);

    React.useEffect(() => {
        console.debug("SplitSlot updating content for slot:", slot.id);
        setFirst(prev => ({
            ...prev,
            node: createSplitPartContent(slot.first, refreshSlot, prev.ref)
        }));
        setSecond(prev => ({
            ...prev,
            node: createSplitPartContent(slot.second, refreshSlot, prev.ref)
        }));
    }, [slot.first, slot.second, refresh]);

    console.debug("SplitSlot rendering slot:", slot.id);

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