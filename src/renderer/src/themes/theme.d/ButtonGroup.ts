import { ComponentsOverrides, Theme } from "@mui/material";
import { ButtonGroupProps } from "../../components/buttons/ButtonGroup";

export type ButtonGroupComponentProps = Partial<ButtonGroupProps>;

export type ButtonGroupComponent = {
    //defaultProps?: ComponentsPropsList['Button'];
    styleOverrides?: ComponentsOverrides<Theme>['ButtonGroup'];
}

export type ButtonGroupComponentSlots =
    "root"
    ;
