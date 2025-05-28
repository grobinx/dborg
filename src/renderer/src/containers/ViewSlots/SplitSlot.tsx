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
    const [first, setFirst] = React.useState<React.ReactNode | null>(null);
    const [second, setSecond] = React.useState<React.ReactNode | null>(null);
    const [refresh, setRefresh] = React.useState(false);
    const { registerRefresh, refreshSlot } = useRefreshSlot();

    React.useEffect(() => {
        setFirst(createSplitPartContent(slot.first, refreshSlot) ?? null);
        setSecond(createSplitPartContent(slot.second, refreshSlot) ?? null);
    }, [slot.first, slot.second, refresh]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setRefresh(prev => !prev);
        });
        return unregisterRefresh;
    }, [slot.id]);

    return (
        <SplitPanelGroup direction={slot.direction ?? "horizontal"} autoSaveId={slot.autoSaveId} >
            <SplitPanel>
                {first}
            </SplitPanel>
            <Splitter />
            <SplitPanel defaultSize={slot.secondSize ?? 30}>
                {second}
            </SplitPanel>
        </SplitPanelGroup>
    );
};

export default SplitSlot;