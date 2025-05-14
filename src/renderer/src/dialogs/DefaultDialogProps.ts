import { ButtonProps,TextFieldProps } from "@mui/material"

export interface DefaultDialogProps {
    slotProps?: {
        textField?: TextFieldProps,
        button?: ButtonProps,
    }
}
