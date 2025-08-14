import React from "react";
import { BaseButtonProps } from "./BaseButtonProps";
import { BaseButton } from "./BaseButton";

export interface ToolButtonOwnProps extends BaseButtonProps {
}

export const ToolButton = React.memo<ToolButtonOwnProps>((props) => {
    const { ...other } = props;

    return (
        <BaseButton
            componentName="ToolButton"
            {...other}
        />
    );
});
