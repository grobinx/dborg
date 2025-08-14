import React from "react";
import { BaseButtonProps } from "./BaseButtonProps";
import { BaseButton } from "./BaseButton";
import { styled } from "@mui/material";
import { FormattedContent } from "../useful/FormattedText";
import Tooltip from "../Tooltip";

export interface IconButtonOwnProps extends BaseButtonProps {
}

export const IconButton = React.memo<IconButtonOwnProps>((props) => {
    const { ...other } = props;

    return (
        <BaseButton
            componentName="IconButton"
            {...other}
        />
    );
});
