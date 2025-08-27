import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import { WindowControlButton } from "@renderer/app/MenuBar";

export type WindowControlButtonComponentProps = Partial<React.ComponentProps<typeof WindowControlButton>>;

export type WindowControlButtonComponent = {
    defaultProps?: ComponentsPropsList['WindowControlButton'];
    styleOverrides?: ComponentsOverrides<Theme>['WindowControlButton'];
}

export type WindowControlButtonComponentSlots =
    "root" 
    ;
