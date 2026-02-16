import React from "react";
import { styled, Box, useThemeProps } from "@mui/material";
import { useMessages } from "@renderer/contexts/MessageContext";
import { TAB_PANEL_VALUE } from "@renderer/app/Messages";

// Styled TabPanel component
const StyledTabPanel = styled(Box, {
    name: "TabPanel",
    slot: "content",
})(() => ({
}));

export interface TabPanelProps extends React.ComponentProps<typeof Box> {
}

export interface TabPanelOwnProps extends Omit<TabPanelProps, "label" | "content"> {
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

export const useTabValue = <T, >(itemID: string, name: string, defaultValue?: T) => {
    const [value, setValue] = React.useState<T | undefined>(defaultValue);
    const { subscribe, queueMessage } = useMessages();

    React.useEffect(() => {
        const unsubscribe = subscribe(TAB_PANEL_VALUE, (message) => {
            if (message.itemID === itemID && message.name === name) {
                setValue(message.value);
            }
        });
        return () => {
            unsubscribe();
        };
    }, [itemID, name]);

    const setTabValue = React.useCallback((newValue: T) => {
        if (newValue === value) return;
        
        queueMessage(TAB_PANEL_VALUE, {
            itemID,
            name,
            value: newValue,
        });
    }, [itemID, name]);

    return [value, setTabValue] as const;
};

export default TabPanel;