import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import SideBar from "@renderer/app/SideBar";

export type SideBarComponentProps = Partial<React.ComponentProps<typeof SideBar>>;

export type SideBarComponent = {
    defaultProps?: ComponentsPropsList['SideBar'];
    styleOverrides?: ComponentsOverrides<Theme>['SideBar'];
}

export type SideBarComponentSlots =
    "root" 
    ;
