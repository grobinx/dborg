import React from "react";
import { BaseButtonProps } from "./BaseButtonProps";
import { BaseButton } from "./BaseButton";

export interface ButtonOwnProps extends BaseButtonProps {
}

export const Button: React.FC<ButtonOwnProps> = (props) => {
    const { ...other } = props;

    return (
        <BaseButton
            componentName="Button"
            {...other}
        />
    );
};
