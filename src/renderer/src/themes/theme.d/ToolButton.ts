import { ComponentsOverrides, Theme } from "@mui/material";
import { ButtonOwnProps } from "@renderer/components/buttons/Button";

export type ToolButtonComponentProps = Partial<ButtonOwnProps>;

export type ToolButtonComponent = {
    //defaultProps?: ComponentsPropsList['ToolButton'];
    styleOverrides?: ComponentsOverrides<Theme>['ToolButton'];
}

export type ToolButtonComponentSlots =
    "root"
    | "content"
    | "loading"
    | "loadingIndicator"
    | "loadingContent"
    ;
