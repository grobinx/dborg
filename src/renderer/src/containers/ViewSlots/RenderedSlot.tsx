import React from "react";
import { Box, styled, useTheme } from "@mui/material";
import { IRenderedSlot, SlotFactoryContext } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useRefreshSlot } from "./RefreshSlotContext";
import { useVisibleState } from "@renderer/hooks/useVisibleState";

interface RenderedSlotProps extends Omit<React.ComponentProps<typeof Box>, "slot"> {
}

interface RenderedSlotOwnProps extends RenderedSlotProps {
    slot: IRenderedSlot;
    ref?: React.Ref<HTMLDivElement>;
    tabsItemID?: string;
}

const StyledRenderedSlotBox = styled(Box)({
    width: "100%",
    height: "100%",
});

const RenderedSlot: React.FC<RenderedSlotOwnProps> = (props) => {
    const theme = useTheme();
    const { slot, ref, className, tabsItemID, ...other } = props;
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();
    const [, reRender] = React.useState<bigint>(0n);
    const slotContext: SlotFactoryContext = React.useMemo(() => ({ theme, refresh: refreshSlot }), [theme, refreshSlot]);

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, (redraw) => {
            if (redraw === "only") {
                reRender(prev => prev + 1n);
            } else {
                setPendingRefresh(true);
            }
        });
        slot?.onMount?.(slotContext);
        return () => {
            unregisterRefresh();
            slot?.onUnmount?.(slotContext);
        };
    }, [slot.id]);

    React.useEffect(() => {
        if (rootVisible && pendingRefresh) {
            setRefresh(prev => prev + 1n);
            setPendingRefresh(false);
        }
    }, [rootVisible, pendingRefresh]);

    React.useEffect(() => {
        if (rootVisible) {
            slot?.onShow?.(slotContext);
        } else {
            slot?.onHide?.(slotContext);
        }
    }, [rootVisible]);
    
    return (
        <StyledRenderedSlotBox
            ref={rootRef}
            //key={`${slot.id}-${refresh}`}
            className={`RenderedSlot-root ${className ?? ""}`}
            {...other}
        >
            <slot.render slotContext={slotContext} />
        </StyledRenderedSlotBox>
    );
};

export default RenderedSlot;