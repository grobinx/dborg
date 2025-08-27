import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import { ZoomStateProps } from "@renderer/app/MenuBar";
import { ButtonOwnProps } from "@renderer/components/buttons/Button";

export type ZoomStateComponentProps = Partial<ZoomStateProps>;

export type ZoomStateComponent = {
    defaultProps?: ComponentsPropsList['ZoomState'];
    styleOverrides?: ComponentsOverrides<Theme>['ZoomState'];
}

export type ZoomStateComponentSlots =
    "root"
    | "value"
    ;
