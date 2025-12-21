import React from "react";
import { Box, styled } from "@mui/material";
import { IRenderedSlot } from "../../../../../plugins/manager/renderer/CustomSlots";
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
    const { slot, ref, className, tabsItemID, ...other } = props;
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const { registerRefresh, refreshSlot } = useRefreshSlot();
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slot.id, () => {
            setPendingRefresh(true);
        });
        slot?.onMount?.(refreshSlot);
        return () => {
            unregisterRefresh();
            slot?.onUnmount?.(refreshSlot);
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
            slot?.onShow?.(refreshSlot);
        } else {
            slot?.onHide?.(refreshSlot);
        }
    }, [rootVisible]);
    
    return (
        <StyledRenderedSlotBox
            ref={rootRef}
            //key={`${slot.id}-${refresh}`}
            className={`RenderedSlot-root ${className ?? ""}`}
            {...other}
        >
            <slot.render refresh={refreshSlot} />
        </StyledRenderedSlotBox>
    );
};

export default RenderedSlot;