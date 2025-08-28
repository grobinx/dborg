import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import { StatusBarButton } from "@renderer/app/StatusBar";

export type StatusBarButtonComponentProps = React.ComponentProps<typeof StatusBarButton>;

export type StatusBarButtonComponent = {
    defaultProps?: ComponentsPropsList['StatusBarButton'];
    styleOverrides?: ComponentsOverrides<Theme>['StatusBarButton'];
}

export type StatusBarButtonComponentSlots =
    "root"
    | "content"
    | "loading"
    | "loadingIndicator"
    | "loadingContent"
    ;
