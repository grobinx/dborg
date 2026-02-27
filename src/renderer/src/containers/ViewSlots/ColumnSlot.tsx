import React from "react";
import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import {
    IColumnSlot,
    resolveContentSlotKindsFactory,
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { createContentComponent } from "./helpers";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { uuidv7 } from "uuidv7";
import { useSlotRuntimeContext } from "./hooks/useSlotRuntimeContext";

interface ColumnSlotProps extends Omit<React.ComponentProps<typeof Box>, "slot"> { }

interface ColumnSlotOwnProps extends ColumnSlotProps {
    slot: IColumnSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const StyledColumnSlot = styled(Box)(() => ({
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    minHeight: 0,
    minWidth: 0,
    //gap: 8,
}));

const ColumnSlot: React.FC<ColumnSlotOwnProps> = (props) => {
    const { slot, ref, ...other } = props;
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
        const items = resolveContentSlotKindsFactory(slot.items, runtimeContext) ?? [];

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

    const columnWidth = typeof slot.size === "number" ? `${(slot.size / 12) * 100}%` : undefined;

    return (
        <StyledColumnSlot
            ref={rootRef}
            className={'ColumnSlot-root'}
            sx={{
                flex: columnWidth ? `0 0 ${columnWidth}` : slot.size === "auto" ? "0 1 auto" : undefined,
                maxWidth: columnWidth,
                minWidth: 0,
                padding: slot.padding,
                gap: slot.gap,
                overflow: !slot.size ? "auto" : "hidden",
            }}
            {...other}
        >
            {itemsNodes}
        </StyledColumnSlot>
    );
};

export default ColumnSlot;