import React from "react";
import { Box, styled } from "@mui/material";
import { IRenderedSlot } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { uuidv7 } from "uuidv7";
import { useSlotRuntimeContext } from "./hooks/useSlotRuntimeContext";

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
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const [, setRefresh] = React.useState<bigint>(0n);
    const { registerRefresh } = useViewSlot();
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();
    const [, reRender] = React.useState<bigint>(0n);
    const runtimeContext = useSlotRuntimeContext({});

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slotId, (redraw) => {
            if (redraw === "only") {
                reRender(prev => prev + 1n);
            } else {
                setPendingRefresh(true);
            }
        });
        slot?.onMount?.(runtimeContext);
        return () => {
            unregisterRefresh();
            slot?.onUnmount?.(runtimeContext);
        };
    }, [slotId]);

    React.useEffect(() => {
        if (rootVisible && pendingRefresh) {
            setRefresh(prev => prev + 1n);
            setPendingRefresh(false);
        }
    }, [rootVisible, pendingRefresh]);

    React.useEffect(() => {
        if (rootVisible) {
            slot?.onShow?.(runtimeContext);
        } else {
            slot?.onHide?.(runtimeContext);
        }
    }, [rootVisible]);

    return (
        <StyledRenderedSlotBox
            ref={rootRef}
            className={`RenderedSlot-root ${className ?? ""}`}
            {...other}
        >
            <slot.render runtimeContext={runtimeContext} />
        </StyledRenderedSlotBox>
    );
};

export default RenderedSlot;