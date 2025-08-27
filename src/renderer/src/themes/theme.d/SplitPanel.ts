import { ComponentsOverrides, Theme } from "@mui/material";
import { SplitPanel } from "@renderer/components/SplitPanel";

export type SplitPanelComponentProps = Partial<React.ComponentProps<typeof SplitPanel>>;

export type SplitPanelComponent = {
    //defaultProps?: ComponentsPropsList['SplitPanel'];
    styleOverrides?: ComponentsOverrides<Theme>['SplitPanel'];
}

export type SplitPanelComponentSlots =
    "group" 
    | "panel" 
    | "splitter"
    ;
