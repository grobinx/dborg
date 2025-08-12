import React from "react";
import { BaseButtonProps } from "./BaseButtonProps";
import { BaseButton } from "./BaseButton";
import { styled } from "@mui/material";

interface ButtonProps extends BaseButtonProps {
}

const StyledButton = styled(BaseButton, {
    name: "Button",
    slot: "root",
})(({ theme }) => ({
}));

export const Button = React.memo<ButtonProps>((props) => {
    const { ...other } = props;

    return (
        <StyledButton
            componentName="Button"
            {...other}
        />
    );
});
