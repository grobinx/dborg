import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import ViewButton from "@renderer/app/SideBar/ViewButton";

export type ViewButtonComponentProps = Partial<React.ComponentProps<typeof ViewButton>>;

export type ViewButtonComponent = {
    defaultProps?: ComponentsPropsList['ViewButton'];
    styleOverrides?: ComponentsOverrides<Theme>['ViewButton'];
}

export type ViewButtonComponentSlots =
    "root"
    | "content"
    | "loading"
    | "loadingIndicator"
    | "loadingContent"
    ;
