import { Checkbox, TextField } from "@mui/material";
import { BaseInputProps } from "./BaseInput";

export interface BaseCheckboxProps extends
    Omit<React.ComponentProps<typeof Checkbox>, "onChange" | "value" | "disabled" | "onClick">,
    Partial<BaseInputProps> {
}

const BaseCheckbox: React.FC<BaseCheckboxProps> = (props) => {
    const { id, value, onChange, disabled, ...other } = props;
    return (
        <Checkbox
            id={id}
            className="BaseCheckbox"
            disableRipple
            checked={value}
            onChange={onChange}
            disabled={disabled}
            {...other}
        />
    );
};

export default BaseCheckbox;