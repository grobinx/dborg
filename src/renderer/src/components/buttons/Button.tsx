import React from "react";
import { BaseButtonProps } from "./BaseButtonProps";
import { BaseButton } from "./BaseButton";
import { styled } from "@mui/material";
import clsx from "@renderer/utils/clsx";

interface ButtonProps extends BaseButtonProps {
}

const StyledButton = styled(BaseButton, {
    name: "Button",
    slot: "root",
})(({ theme }) => ({
}));

export const Button = React.memo<ButtonProps>((props) => {
    const { className, ...other } = props;

    return (
        <StyledButton
            className={clsx(
                "Button-root",
                className
            )}
            {...other}
        />
    );
});
