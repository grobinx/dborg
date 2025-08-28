import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import TabsPanel from "@renderer/components/TabsPanel/TabsPanel";

export type TabsPanelComponentProps = Partial<React.ComponentProps<typeof TabsPanel>>;

export type TabsPanelComponent = {
    defaultProps?: ComponentsPropsList['TabsPanel'];
    styleOverrides?: ComponentsOverrides<Theme>['TabsPanel'];
}

export type TabsPanelComponentSlots =
    "root" | "header" | "content"
    ;
