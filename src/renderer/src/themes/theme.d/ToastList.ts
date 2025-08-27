import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import ToastList from "@renderer/components/notifications/ToastList";

export type ToastListComponentProps = Partial<React.ComponentProps<typeof ToastList>>;

export type ToastListComponent = {
    defaultProps?: ComponentsPropsList['ToastList'];
    styleOverrides?: ComponentsOverrides<Theme>['ToastList'];
}

export type ToastListComponentSlots =
    "root" | "paper" | "alert"
    ;
