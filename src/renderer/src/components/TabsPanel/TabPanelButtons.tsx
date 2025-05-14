import React from 'react';
import { Stack, styled, useThemeProps } from '@mui/material';

const StyledTabPanelButtons = styled(Stack, {
    name: "TabPanel",
    slot: "buttons",
})(({ /*theme*/ }) => ({
    flexDirection: "row",
    alignItems: "center",
}));

export interface TabPanelButtonsProps extends React.ComponentProps<typeof StyledTabPanelButtons> {
}

interface TabPanelButtonsOwnProps extends TabPanelButtonsProps {
}

const TabPanelButtons: React.FC<TabPanelButtonsOwnProps> = (props) => {
    const { children, ...other } = useThemeProps({ name: "TabPanelButtons", props: props, });
    return (
        <StyledTabPanelButtons className='TabPanel-buttons' {...other}>
            {children}
        </StyledTabPanelButtons>
    );
};

export default TabPanelButtons;