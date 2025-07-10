
import { Select, SelectProps, SelectVariants, styled, TextField, TextFieldProps, TextFieldVariants, useThemeProps, SelectChangeEvent } from "@mui/material";

const StyledToolSelect = styled(Select, {
    name: "ToolSelect",
    slot: "root",
})(() => ({
    minWidth: 150,
    maxWidth: 150,
}));

export interface ToolSelectProps<T = unknown> extends Omit<SelectProps<T>, 'variant' | 'value' | 'renderValue' | 'onChange'> {
    variant?: SelectVariants;
}

export interface ToolSelectOwnProps<T> extends ToolSelectProps<T> {
    value?: T;
    renderValue?: (value: T) => React.ReactNode;
    onChange?: (event: SelectChangeEvent<T>, child: React.ReactNode) => void;
}

const ToolSelect = <T,>(props: ToolSelectOwnProps<T>) => {
    const { className, variant, value, renderValue, onChange, ...other } = useThemeProps({ name: "ToolSelect", props });
    return (
        <StyledToolSelect
            className={`ToolSelect-root ${className ?? ""}`}
            variant={variant}
            value={value}
            renderValue={renderValue as ((value: unknown) => React.ReactNode) | undefined}
            onChange={onChange as ((event: SelectChangeEvent<unknown>, child: React.ReactNode) => void) | undefined}
            {...other}
        />
    );
};

export default ToolSelect;