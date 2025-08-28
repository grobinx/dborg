import React from "react";
import { BaseButtonProps } from "./BaseButtonProps";
import { BaseButton } from "./BaseButton";

export interface IconButtonOwnProps extends BaseButtonProps {
}

export const IconButton: React.FC<IconButtonOwnProps> = (props) => {
    const { ...other } = props;

    return (
        <BaseButton
            componentName="IconButton"
            {...other}
        />
    );
};
