import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import StatusBar from "@renderer/app/StatusBar";

export type StatusBarComponentProps = Partial<React.ComponentProps<typeof StatusBar>>;

export type StatusBarComponent = {
    defaultProps?: ComponentsPropsList['StatusBar'];
    styleOverrides?: ComponentsOverrides<Theme>['StatusBar'];
}

export type StatusBarComponentSlots =
    'root' | 'button'
    ;
