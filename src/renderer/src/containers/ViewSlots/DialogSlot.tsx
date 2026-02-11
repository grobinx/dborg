import React from "react";
import { useTheme } from "@mui/material/styles";
import {
    IDialogSlot,
    SlotRuntimeContext,
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { useViewSlot } from "./ViewSlotContext";
import { uuidv7 } from "uuidv7";
import { useToast } from "@renderer/contexts/ToastContext";
import { useDialogs } from "@toolpad/core";
import { DialogBase } from "./dialog/DialogBase";
import { useVisibleState } from "@renderer/hooks/useVisibleState";

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

    const theme = useTheme();
    const addToast = useToast();
    const { confirm } = useDialogs();
    const slotId = React.useMemo(() => slot.id ?? uuidv7(), [slot.id]);
    const { registerRefresh, refreshSlot, openDialog } = useViewSlot();
    const [dialogRef, dialogVisible] = useVisibleState<HTMLDivElement>();
    const [refresh, setRefresh] = React.useState<bigint>(0n);

    const [forceRender, setForceRender] = React.useState<bigint>(0n);
    const [pendingRefresh, setPendingRefresh] = React.useState(false);

    const runtimeContext: SlotRuntimeContext = React.useMemo(() => ({
        theme,
        refresh: refreshSlot,
        openDialog,
        showNotification: ({ message, severity = "info" }) => {
            addToast(severity, message);
        },
        showConfirmDialog: async ({ message, title, severity, cancelLabel, confirmLabel }) => {
            return confirm(message, { title, severity, okText: confirmLabel, cancelText: cancelLabel });
        },
    }), [theme, refreshSlot, openDialog, addToast, confirm]);

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
