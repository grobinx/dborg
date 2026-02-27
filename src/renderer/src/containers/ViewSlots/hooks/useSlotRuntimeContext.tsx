import React from "react";
import { SlotRuntimeContext } from "../../../../../../plugins/manager/renderer/CustomSlots";
import { useToast } from "@renderer/contexts/ToastContext";
import { useDialogs } from "@toolpad/core";
import { useViewSlot } from "../ViewSlotContext";
import { useTheme } from "@mui/material";

interface UseSlotRuntimeContextParams {
}

export function useSlotRuntimeContext({}: UseSlotRuntimeContextParams): SlotRuntimeContext {
    const theme = useTheme();
    const addToast = useToast();
    const { confirm } = useDialogs();
    const { refreshSlot, openDialog } = useViewSlot();

    return React.useMemo(
        () => ({
            theme,
            refresh: refreshSlot,
            openDialog,
            showNotification: ({ message, severity = "info" }) => {
                addToast(severity, message);
            },
            showConfirmDialog: async ({ message, title, severity, cancelLabel, confirmLabel }) => {
                return confirm(message, {
                    title,
                    severity,
                    okText: confirmLabel,
                    cancelText: cancelLabel,
                });
            },
        }),
        [theme, refreshSlot, openDialog, addToast, confirm]
    );
}