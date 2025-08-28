import { TextFieldProps } from "@mui/material"
import { Button } from "@renderer/components/buttons/Button"

export interface DefaultDialogProps {
    slotProps?: {
        textField?: TextFieldProps,
        button?: React.ComponentProps<typeof Button>,
    }
}
