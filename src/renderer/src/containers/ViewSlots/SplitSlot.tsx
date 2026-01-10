import React from "react";
import { ISplitSlot, SlotFactoryContext } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import { SplitPanel, SplitPanelGroup, Splitter } from "@renderer/components/SplitPanel";
import { createSplitPartContent } from "./helpers";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { ImperativePanelGroupHandle } from "react-resizable-panels";
import { useTheme } from "@mui/material";

interface SplitSlotProps {
}

interface SplitSlotOwnProps extends SplitSlotProps {
    slot: ISplitSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const SplitSlot: React.FC<SplitSlotOwnProps> = (props) => {
    const theme = useTheme();
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
    const slotContext: SlotFactoryContext = React.useMemo(() => ({ theme, refresh: refreshSlot }), [theme, refreshSlot]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, (redraw) => {
            if (redraw === "only") {
                reRender(prev => prev + 1n);
            } else {
                setRefresh(prev => prev + 1n);
            }
        });
        slot?.onMount?.(slotContext);
        return () => {
            unregisterRefresh();
            slot?.onUnmount?.(slotContext);
        };
    }, [slot.id]);

    React.useEffect(() => {
        console.debug("SplitSlot updating content for slot:", slot.id);
        setFirst(prev => ({
            ...prev,
            node: createSplitPartContent(slot.first, slotContext, prev.ref)
        }));
        setSecond(prev => ({
            ...prev,
            node: createSplitPartContent(slot.second, slotContext, prev.ref)
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