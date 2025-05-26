import React from 'react';
import { Stack, styled, useThemeProps } from '@mui/material';

const StyledTabPanelContent = styled(Stack, {
    name: "TabPanel",
    slot: "content",
})(({ /*theme*/ }) => ({
    flexDirection: "row",
    alignItems: "center",
}));

export interface TabPanelContentProps extends React.ComponentProps<typeof StyledTabPanelContent> {
}

interface TabPanelContentOwnProps extends TabPanelContentProps {
    tabsItemID?: string;
    children?: React.ReactNode;
    ref?: React.Ref<HTMLDivElement>;
}

const TabPanelContent: React.FC<TabPanelContentOwnProps> = (props) => {
    const { children, tabsItemID, ref, ...other } = useThemeProps({ name: "TabPanelContent", props: props, });

    return <StyledTabPanelContent className='TabPanel-content' ref={ref} {...other}>
        {children}
    </StyledTabPanelContent>;
};

export default TabPanelContent;