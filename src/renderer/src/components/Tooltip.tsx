import React, { isValidElement } from "react";
import { Tooltip as MuiTooltip, TooltipProps as MuiTooltipProps, useTheme } from "@mui/material";
import { markdown, MarkdownString } from "./useful/MarkdownTransform";

export interface TooltipProps extends Exclude<MuiTooltipProps, "title"> {
    title: Exclude<React.ReactNode, string | number | bigint | boolean> | MarkdownString;
}

const Tooltip: React.FC<TooltipProps> = ({ children, title, ...props }) => {
    const theme = useTheme();
    return (
        <MuiTooltip
            title={isValidElement(title) ? title : (title != null ? markdown(title as MarkdownString) : "")}
            {...props}
        >
            {children}
        </MuiTooltip>
    );
};

export default Tooltip;

