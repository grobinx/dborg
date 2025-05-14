import { Box, Stack, StackProps, styled, useTheme, useThemeProps } from "@mui/material";
import React from "react";

const StatusBarRoot = styled(Stack, {
    name: 'StatusBar', // The component name
    slot: 'root', // The slot name
})(({ theme }) => ({
    backgroundColor: theme.palette.background.statusBar,
}));

export interface StatusBarProps extends StackProps {
}

interface StatusBarOwnProps extends StatusBarProps {
    buttons?: {
        first?: React.ReactNode;
        last?: React.ReactNode;
    }
}

const StatusBar: React.FC<StatusBarOwnProps> = (props) => {
    const { className, ref, buttons, ...other } = useThemeProps({ name: 'StatusBar', props });

    return (
        <StatusBarRoot
            direction="row"
            {...other}
            className={(className ?? "") + " StatusBar-root"}
            ref={ref}
        >
            {buttons?.first}
            <Box flexGrow={1} />
            {buttons?.last}
        </StatusBarRoot>
    );
}

export default StatusBar;