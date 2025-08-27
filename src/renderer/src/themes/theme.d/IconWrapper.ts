import { ComponentsOverrides, Theme } from "@mui/material";
import { ButtonOwnProps } from "@renderer/components/buttons/Button";
import { IconWrapperProps } from "../icons";

export type IconWrapperComponentProps = Partial<IconWrapperProps>;

export type IconWrapperComponent = {
    //defaultProps?: ComponentsPropsList['IconButton'];
    styleOverrides?: ComponentsOverrides<Theme>['IconWrapper'];
}

export type IconWrapperComponentSlots =
    "root"
    ;
