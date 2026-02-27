import React from "react";
import {
    IDialogSlot,
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { uuidv7 } from "uuidv7";
import { DialogBase } from "./dialog/DialogBase";
import { useVisibleState } from "@renderer/hooks/useVisibleState";
import { useSlotRuntimeContext } from "./hooks/useSlotRuntimeContext";

interface DialogSlotProps {
    slot: IDialogSlot;
    open?: boolean;
    params?: Record<string, any>;
    onClose?: (structure: Record<string, any> | null) => void;
}

/**
 * Component for slot-based dialogs (with full lifecycle management).
 * Use this for dialogs that are part of the slot system and need refresh/openDialog capabilities.
 */
const DialogSlot: React.FC<DialogSlotProps> = (props) => {
    const {
        slot,
        open = true,
        params,
        onClose,
    } = props;

    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const { registerRefresh } = useViewSlot();
    const [dialogRef, dialogVisible] = useVisibleState<HTMLDivElement>();
    const [refresh, setRefresh] = React.useState<bigint>(0n);

    const [forceRender, setForceRender] = React.useState<bigint>(0n);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);

    const runtimeContext = useSlotRuntimeContext({});

    React.useEffect(() => {
        const unregisterRefresh = registerRefresh(slotId, (redraw) => {
            if (redraw === "only") {
                setForceRender(prev => prev + 1n);
            } else {
                setPendingRefresh(true);
            }
        });
        return () => {
            unregisterRefresh();
        };
    }, [slotId, registerRefresh]);

    React.useEffect(() => {
        if (dialogVisible && pendingRefresh) {
            setRefresh(prev => prev + 1n);
            setPendingRefresh(false);
        }
    }, [dialogVisible, pendingRefresh]);

    React.useEffect(() => {
        slot?.onMount?.(runtimeContext);
        return () => {
            slot?.onUnmount?.(runtimeContext);
        };
    }, [runtimeContext, slot]);

    React.useEffect(() => {
        if (dialogVisible) {
            slot?.onShow?.(runtimeContext);
        } else {
            slot?.onHide?.(runtimeContext);
        }
    }, [dialogVisible, runtimeContext, slot]);

    const handleRefresh = React.useCallback(() => {
        if (pendingRefresh) {
            setPendingRefresh(false);
            setForceRender(prev => prev + 1n);
        }
    }, [pendingRefresh]);

    return (
        <DialogBase
            dialog={slot}
            open={open}
            params={params}
            onClose={onClose}
            handleRefresh={handleRefresh}
            ref={dialogRef}
        />
    );
};

export default DialogSlot;
