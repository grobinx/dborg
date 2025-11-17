import React from "react";
import { Tooltip as MuiTooltip, TooltipProps as MuiTooltipProps, useTheme } from "@mui/material";
import { FormattedText, FormattedContent } from "./useful/FormattedText";

export interface TooltipProps extends Omit<MuiTooltipProps, "title"> {
    title: FormattedContent;
    interactive?: boolean;
}

const getChildDisabled = (child: React.ReactNode) => {
    if (React.isValidElement(child) && "disabled" in (child.props as any)) {
        return !!(child.props as any).disabled;
    }
    return false;
};

const Tooltip: React.FC<TooltipProps> = ({ children, title, interactive = false, ...props }) => {
    const childIsDisabled = getChildDisabled(children);

    if (!title || childIsDisabled) {
        return children;
    }
    return (
        <MuiTooltip
            title={<FormattedText text={title} />}
            disableInteractive={!interactive}
            {...props}
        >
            {children}
        </MuiTooltip>
    );
};

export default Tooltip;

