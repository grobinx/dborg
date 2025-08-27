import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import MenuBar from "@renderer/app/MenuBar";
import StatusBar from "@renderer/app/StatusBar";

export type MenuBarComponentProps = Partial<React.ComponentProps<typeof MenuBar>>;

export type MenuBarComponent = {
    defaultProps?: ComponentsPropsList['MenuBar'];
    styleOverrides?: ComponentsOverrides<Theme>['MenuBar'];
}

export type MenuBarComponentSlots =
    'root' | 'title'
    ;
