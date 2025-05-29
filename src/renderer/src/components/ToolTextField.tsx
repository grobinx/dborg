import { styled, TextField, TextFieldProps, TextFieldVariants, useThemeProps } from "@mui/material";

const StyledToolTextField = styled(TextField, {
    name: "ToolTextField",
    slot: "root",
})(() => ({
}));

export interface ToolTextFieldProps extends Omit<TextFieldProps, 'variant'> {
    variant?: TextFieldVariants;
}

export interface ToolTextFieldOwnProps extends ToolTextFieldProps {
}

const ToolTextField: React.FC<ToolTextFieldProps> = (props) => {
    const { className, ...other } = useThemeProps({ name: "ToolTextField", props });
    return (
        <StyledToolTextField
            className={`ToolTextField-root ${className ?? ""}`}
            {...other}
        />
    );
};

export default ToolTextField;