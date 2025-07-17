import { Button, ButtonProps, styled, useThemeProps } from "@mui/material";
import Tooltip from "@renderer/components/Tooltip";
import React from "react";

export interface WindowControlButtonProps extends ButtonProps {
}

interface WindowControlButtonOwnProps extends WindowControlButtonProps {
    toolTip?: string,
}

const WindowControlButtonRoot = styled(Button, {
    name: 'WindowControlButton', // The component name
    slot: 'root', // The slot name
})(({ theme }) => ({
    minWidth: 0,
    color: theme.palette.menuBar?.contrastText,
    lineHeight: 0,
    fontSize: "inherit",
    '& .IconWrapper-root': {
        color: theme.palette.menuBar?.icon
    },
}));

const WindowControlButton: React.FC<WindowControlButtonOwnProps> = (props) => {
    const { toolTip, className, ...other } = useThemeProps({ name: 'WindowControlButton', props });
    return (
        <Tooltip title={toolTip}>
            <WindowControlButtonRoot
                {...other}
                className={className + " WindowControlButton-root"}
            >
                {other.children}
            </WindowControlButtonRoot>
        </Tooltip>
    );
}

export default WindowControlButton;
