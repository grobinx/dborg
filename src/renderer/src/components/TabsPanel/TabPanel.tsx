import React from "react";
import { styled, Box, useThemeProps } from "@mui/material";

// Styled TabPanel component
const StyledTabPanel = styled(Box, {
    name: "TabPanel",
    slot: "content",
})(() => ({
}));

export interface TabPanelProps extends React.ComponentProps<typeof StyledTabPanel> {
}

export interface TabPanelOwnProps extends Omit<TabPanelProps, "label"> {
    label?: React.ReactNode;
    content?: React.ReactNode;
    buttons?: React.ReactNode;
    value?: number;
    index?: number;
    itemID?: string;
}

const TabPanel: React.FC<TabPanelOwnProps> = (props) => {
    const { buttons, label, content, value, index, ...other } = useThemeProps({name: "TabPanel", props: props, });

    return (
        <StyledTabPanel
            className={"TabPanel-content" +(value === index ? " Mui-selected" : "")}
            {...other}
        >
            {content}
        </StyledTabPanel>
    );
};

export default TabPanel;