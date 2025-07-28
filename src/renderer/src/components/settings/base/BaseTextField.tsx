import { TextField } from "@mui/material";
import { BaseInputProps } from "./BaseInput";

export interface BaseTextFieldProps extends
    Omit<React.ComponentProps<typeof TextField>, "onChange" | "value" | "disabled" | "onClick">,
    Partial<BaseInputProps> {
}

const BaseTextField: React.FC<BaseTextFieldProps> = (props) => {
    const { id, value, onChange, disabled, ...other } = props;
    return (
        <TextField
            id={id}
            className="BaseTextField"
            value={value}
            onChange={(e) => onChange?.(e, e.target.value)}
            disabled={disabled}
            {...other}
        />
    );
};

export default BaseTextField;