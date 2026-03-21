import React from "react";
import { Box, styled } from "@mui/material";
import { IRenderedSlot, IRichSlot, resolveValue } from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { uuidv7 } from "uuidv7";
import { useSlotRuntimeContext } from "./hooks/useSlotRuntimeContext";
import { RichContainer } from "@renderer/components/RichContent";

interface RichSlotProps {
}

interface RichSlotOwnProps extends RichSlotProps {
    slot: IRichSlot;
    ref?: React.Ref<HTMLDivElement>;
    tabsItemID?: string;
}

const RichSlot: React.FC<RichSlotOwnProps> = (props) => {
    const { slot, ref, tabsItemID, ...other } = props;
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const { registerRefresh } = useViewSlot();
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();
    const [, reRender] = React.useState<bigint>(0n);
    const runtimeContext = useSlotRuntimeContext({});
    const [content, setContent] = React.useState<React.ReactNode>(null);

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

    React.useEffect(() => {
        const content = resolveValue(slot.content, runtimeContext);

        if (!content) {
            setContent(null);
        } else {
            setContent(<RichContainer node={content} />);
        }
    }, [slot.content, runtimeContext, refresh]);


    return (
        <Box ref={rootRef} sx={{ width: '100%', height: '100%' }} {...other}>
            {content}
        </Box>
    );
};

export default RichSlot;