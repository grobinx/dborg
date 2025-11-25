import React from "react";
import { ISplitSlot } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import { SplitPanel, SplitPanelGroup, Splitter } from "@renderer/components/SplitPanel";
import { createSplitPartContent } from "./helpers";

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
    const [refresh, setRefresh] = React.useState(false);
    const { registerRefresh, refreshSlot } = useRefreshSlot();

    React.useEffect(() => {
        slot?.onMount?.(refreshSlot);
        return () => {
            slot?.onUnmount?.();
        };
    }, [slot]);

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

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setRefresh(prev => !prev);
        });
        return unregisterRefresh;
    }, [slot.id]);

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