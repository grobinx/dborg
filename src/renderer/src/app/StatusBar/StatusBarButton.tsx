import { Button, ButtonProps, styled, Tooltip, useThemeProps } from "@mui/material";
import React from "react";

export interface StatusBarButtonProps extends ButtonProps {
}

interface StatusBarButtonOwnProps extends StatusBarButtonProps {
    toolTip?: string,
}

const StatusBarButtonRoot = styled(Button, {
    name: 'StatusBarButton', // The component name
    slot: 'root', // The slot name
})(({ theme }) => ({
    color: theme.palette.statusBar.contrastText,
    '& .IconWrapper-root': {
        //color: theme.palette.statusBar.icon,
    },
}));

const StatusBarButton: React.FC<StatusBarButtonOwnProps> = (props) => {
    const { toolTip, className, ...other } = useThemeProps({ name: 'StatusBarButton', props });
    return (
        <Tooltip title={toolTip}>
            <StatusBarButtonRoot
                {...other}
                className={(className ?? "") + " StatusBarButton-root"}
            >
                {other.children}
            </StatusBarButtonRoot>
        </Tooltip>
    );
}

export default StatusBarButton;
