import React from 'react';
import { Stack, styled, Typography, useThemeProps } from '@mui/material';

const StyledTabPanelLabel: React.FC<React.ComponentProps<typeof Typography>> = styled(Typography, {
    name: "TabPanel",
    slot: "label",
})(({ /*theme*/ }) => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
}));

export interface TabPanelLabelProps extends React.ComponentProps<typeof StyledTabPanelLabel> {
}

interface TabPanelLabelOwnProps extends TabPanelLabelProps {
    tabsItemID?: string;
    children?: React.ReactNode;
    ref?: React.Ref<HTMLDivElement>;
}

const TabPanelLabel: React.FC<TabPanelLabelOwnProps> = (props) => {
    const { children, tabsItemID, ref, ...other } = useThemeProps({ name: "TabPanelLabel", props: props, });

    return <StyledTabPanelLabel variant="label" className='TabPanel-label' ref={ref} {...other}>
        {children}
    </StyledTabPanelLabel>;
};

export default TabPanelLabel;