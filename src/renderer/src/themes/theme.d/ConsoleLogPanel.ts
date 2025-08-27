import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import { SplitPanel } from "@renderer/components/SplitPanel";
import { ConsoleLogPanel } from "@renderer/components/ToolPanels/ConsoleLogsPanel";

export type ConsoleLogPanelComponentProps = Partial<React.ComponentProps<typeof ConsoleLogPanel>>;

export type ConsoleLogPanelComponent = {
    defaultProps?: ComponentsPropsList['ConsoleLogPanel'];
    styleOverrides?: ComponentsOverrides<Theme>['ConsoleLogPanel'];
}

export type ConsoleLogPanelComponentSlots =
    "root" 
    | "details"
    ;
