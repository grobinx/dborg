import { TextField } from "@mui/material";
import { SettingInputProps } from "./SettingInputControl";

export interface SettingTextFieldProps extends
    Omit<React.ComponentProps<typeof TextField>, "onChange" | "value" | "disabled" | "onClick">,
    Partial<SettingInputProps> {
}

const SettingTextField: React.FC<SettingTextFieldProps> = (props) => {
    const { id, value, onChange, disabled, ...other } = props;
    return (
        <TextField
            id={id}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            {...other}
        />
    );
};

export default SettingTextField;