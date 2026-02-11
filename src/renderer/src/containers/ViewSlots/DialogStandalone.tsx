import React from "react";
import { useTheme } from "@mui/material/styles";
import {
    IDialogStandalone,
} from "../../../../../plugins/manager/renderer/CustomSlots";
import { DialogBase } from "./dialog/DialogBase";

interface DialogStandaloneProps {
    dialog: IDialogStandalone;
    open?: boolean;
    params?: Record<string, any>;
    onClose?: (structure: Record<string, any> | null) => void;
}

/**
 * Component for standalone dialogs (without slot lifecycle management).
 * Use this for dialogs that don't need to be part of the slot system.
 */
export const DialogStandalone: React.FC<DialogStandaloneProps> = (props) => {
    const {
        dialog,
        open = true,
        params,
        onClose,
    } = props;

    return (
        <DialogBase
            dialog={dialog}
            open={open}
            params={params}
            onClose={onClose}
        />
    );
};
