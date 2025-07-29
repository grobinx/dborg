import React from "react";
import { Tooltip as MuiTooltip, TooltipProps as MuiTooltipProps, useTheme } from "@mui/material";
import { markdown, MarkdownString } from "./useful/MarkdownTransform";

export interface TooltipProps extends Exclude<MuiTooltipProps, "title"> {
    title: Exclude<React.ReactNode, string | number | bigint | boolean> | MarkdownString;
}

const Tooltip: React.FC<TooltipProps> = ({ children, title, ...props }) => {
    const theme = useTheme(); // Pobranie theme z Material-UI

    return (
        <MuiTooltip
            title={
                React.isValidElement(title) ? (
                    title
                ) : title != null ? (
                    markdown(title as MarkdownString, theme)
                ) : (
                    ""
                )
            }
            {...props}
        >
            {children}
        </MuiTooltip>
    );
};

export default Tooltip;

