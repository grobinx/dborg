import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import { BaseList } from "@renderer/components/inputs/base/BaseList";

export type BaseListComponent = {
    styleOverrides?: ComponentsOverrides<Theme>['BaseList'];
};

export type BaseListComponentSlots = 
    "root" | "item";

export type BaseListComponentProps = Partial<React.ComponentProps<typeof BaseList>>;

