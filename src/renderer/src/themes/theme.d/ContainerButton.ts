import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import ContainerButton from "@renderer/app/SideBar/ContainerButton";

export type ContainerButtonComponentProps = Partial<React.ComponentProps<typeof ContainerButton>>;

export type ContainerButtonComponent = {
    defaultProps?: ComponentsPropsList['ContainerButton'];
    styleOverrides?: ComponentsOverrides<Theme>['ContainerButton'];
}

export type ContainerButtonComponentSlots =
    "root"
    | "content"
    | "loading"
    | "loadingIndicator"
    | "loadingContent"
    ;
