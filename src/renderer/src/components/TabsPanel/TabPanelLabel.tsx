import React from 'react';
import { Stack, styled, useThemeProps } from '@mui/material';

const StyledTabPanelLabel = styled(Stack, {
    name: "TabPanel",
    slot: "label",
})(({ /*theme*/ }) => ({
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

    return <StyledTabPanelLabel className='TabPanel-label' ref={ref} {...other}>
        {children}
    </StyledTabPanelLabel>;
};

export default TabPanelLabel;