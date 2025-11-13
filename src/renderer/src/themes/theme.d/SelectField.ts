import { ComponentsOverrides, Theme } from "@mui/material";
import { SelectField } from "@renderer/components/inputs/SelectField";

export type SelectFieldComponent = {
    styleOverrides?: ComponentsOverrides<Theme>['SelectField'];
};

export type SelectFieldComponentSlots = 
    "listBox" | "search";

export type SelectFieldComponentProps = Partial<React.ComponentProps<typeof SelectField>>;

