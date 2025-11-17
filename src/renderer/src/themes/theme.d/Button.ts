import { ComponentsOverrides, Theme } from "@mui/material";
import { ButtonOwnProps } from "@renderer/components/buttons/Button";

export type ButtonComponentProps = Partial<ButtonOwnProps>;

export type ButtonComponent = {
    //defaultProps?: ComponentsPropsList['Button'];
    styleOverrides?: ComponentsOverrides<Theme>['Button'];
}

export type ButtonComponentSlots =
    "root"
    | "content"
    | "loading"
    | "loadingContent"
    ;
