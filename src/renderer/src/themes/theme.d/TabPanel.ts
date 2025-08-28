import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import TabPanel from "@renderer/components/TabsPanel/TabPanel";

export type TabPanelComponentProps = Partial<React.ComponentProps<typeof TabPanel>>;

export type TabPanelComponent = {
    defaultProps?: ComponentsPropsList['TabPanel'];
    styleOverrides?: ComponentsOverrides<Theme>['TabPanel'];
}

export type TabPanelComponentSlots =
    "content" | "button" | "label" | "buttons"
    ;
