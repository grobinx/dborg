import React from "react";
import { Tooltip as MuiTooltip, TooltipProps as MuiTooltipProps } from "@mui/material";
import { FormattedText, FormattedContent } from "./useful/FormattedText";

export interface TooltipProps extends Omit<MuiTooltipProps, "title" | "open" | "onOpen" | "onClose"> {
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
    const [open, setOpen] = React.useState(false);

    // Zamykanie tooltipa, gdy dziecko staje się disabled lub tytuł pusty
    React.useEffect(() => {
        if (childIsDisabled || !title) {
            setOpen(false);
        }
    }, [childIsDisabled, title]);

    const handleOpen = () => {
        if (!childIsDisabled) setOpen(true);
    };
    const handleClose = () => setOpen(false);

    return (
        <MuiTooltip
            title={title && <FormattedText text={title} />}
            disableInteractive={!interactive}
            disableHoverListener={childIsDisabled}
            disableFocusListener={childIsDisabled}
            disableTouchListener={childIsDisabled}
            open={open}
            onOpen={handleOpen}
            onClose={handleClose}
            {...props}
        >
            {children}
        </MuiTooltip>
    );
};

export default Tooltip;

