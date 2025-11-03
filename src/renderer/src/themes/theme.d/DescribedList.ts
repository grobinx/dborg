import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import { DescribedList } from "@renderer/components/inputs/DescribedList";

export type DescribedListComponent = {
    styleOverrides?: ComponentsOverrides<Theme>['DescribedList'];
};

export type DescribedListComponentSlots = 
    "root" | "item" | "header" | "option" | "container" | "description";

export type DescribedListComponentProps = Partial<React.ComponentProps<typeof DescribedList>>;

