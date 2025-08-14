import { ComponentsOverrides, Theme } from "@mui/material";
import { ButtonOwnProps } from "@renderer/components/buttons/Button";

export type IconButtonComponentProps = Partial<ButtonOwnProps>;

export type IconButtonComponent = {
    //defaultProps?: ComponentsPropsList['IconButton'];
    styleOverrides?: ComponentsOverrides<Theme>['IconButton'];
}

export type IconButtonComponentSlots =
    "root"
    | "content"
    | "loading"
    | "loadingIndicator"
    | "loadingContent"
    ;
