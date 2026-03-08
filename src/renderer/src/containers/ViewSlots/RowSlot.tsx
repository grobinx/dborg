import React from "react";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
    IRowSlot,
    resolveValue,
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { createContentComponent } from "./helpers";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { uuidv7 } from "uuidv7";
import { useSlotRuntimeContext } from "./hooks/useSlotRuntimeContext";

interface RowSlotProps extends Omit<React.ComponentProps<typeof Box>, "slot"> { }

interface RowSlotOwnProps {
    slot: IRowSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const StyledRowSlot = styled(Box)(() => ({
    display: "flex",
    flexDirection: "row",
    width: "100%",
    height: "100%",
    minHeight: 0,
    minWidth: 0,
    gap: 8,
}));

const RowSlot: React.FC<RowSlotOwnProps> = (props) => {
    const { slot, ref } = props;
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);

    const { registerRefresh } = useViewSlot();
    const runtimeContext = useSlotRuntimeContext({});

    const [itemsNodes, setItemsNodes] = React.useState<React.ReactNode[]>([]);
    const [refresh, setRefresh] = React.useState<bigint>(0n);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);
    const [rootRef, rootVisible] = useVisibleState<HTMLDivElement>();
    const [, reRender] = React.useState<bigint>(0n);

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
        const items = resolveValue(slot.items, runtimeContext) ?? [];

        setItemsNodes(
            items.map((item, index) => {
                const node = createContentComponent(() => item, runtimeContext);
                if (!node) return null;

                return (
                    <React.Fragment key={item.id || index}>
                        {node}
                    </React.Fragment>
                );
            }).filter(Boolean) as React.ReactNode[],
        );
    }, [slot.items, runtimeContext, refresh]);

    const rowHeight = slot.size ? `${(slot.size / 12) * 100}%` : undefined;

    return (
        <StyledRowSlot
            ref={rootRef}
            className={'RowSlot-root'}
            sx={{
                flex: slot.size ? `0 0 ${rowHeight}` : "1 1 0",
                maxHeight: slot.size ? rowHeight : undefined,
                minHeight: 0,
                padding: slot.padding,
            }}
        >
            {itemsNodes}
        </StyledRowSlot>
    );
};

export default RowSlot;