import React from "react";
import { Box } from "@mui/material";
import { styled, useTheme, useThemeProps } from "@mui/material/styles";
import {
    IColumnSlot,
    SlotRuntimeContext,
    resolveContentSlotKindsFactory,
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { createContentComponent } from "./helpers";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { uuidv7 } from "uuidv7";
import { useToast } from "@renderer/contexts/ToastContext";
import { useDialogs } from "@toolpad/core";

interface ColumnSlotProps extends Omit<React.ComponentProps<typeof Box>, "slot"> { }

interface ColumnSlotOwnProps {
    slot: IColumnSlot;
    ref?: React.Ref<HTMLDivElement>;
}

const StyledColumnSlot = styled(Box)(() => ({
    display: "flex",
    flexDirection: "column",
    width: "100%",
    minHeight: 0,
    minWidth: 0,
    gap: 8,
}));

const ColumnSlot: React.FC<ColumnSlotOwnProps> = (props) => {
    const theme = useTheme();
    const { slot, ref } = props;
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const addToast = useToast();
    const { confirm } = useDialogs();
    const { registerRefresh, refreshSlot, openDialog } = useViewSlot();
    const runtimeContext: SlotRuntimeContext = React.useMemo(
        () => ({
            theme, refresh: refreshSlot, openDialog,
            showNotification: ({ message, severity = "info" }) => {
                addToast(severity, message);
            },
            showConfirmDialog: async ({ message, title, severity, cancelLabel, confirmLabel }) => {
                return confirm(message, { title, severity, okText: confirmLabel, cancelText: cancelLabel });
            },
        }),
        [theme, refreshSlot, openDialog, addToast, confirm],
    );

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
            items.map((item) => {
                const node = createContentComponent(() => item, runtimeContext);
                if (!node) return null;

                return (
                    <React.Fragment key={item.id}>
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
                overflow: !slot.size ? "auto" : "hidden",
            }}
        >
            {itemsNodes}
        </StyledColumnSlot>
    );
};

export default ColumnSlot;