import React from "react";
import { Tooltip as MuiTooltip, TooltipProps as MuiTooltipProps, useTheme } from "@mui/material";
import { FormattedText, FormattedContent } from "./useful/FormattedText";

export interface TooltipProps extends Omit<MuiTooltipProps, "title"> {
    title: FormattedContent;
}

const Tooltip: React.FC<TooltipProps> = ({ children, title, ...props }) => {
    return (
        <MuiTooltip
            title={title && <FormattedText text={title} />}
            {...props}
        >
            {children}
        </MuiTooltip>
    );
};

export default Tooltip;

