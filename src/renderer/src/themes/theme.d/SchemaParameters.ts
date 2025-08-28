import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import SchemaParameters from "@renderer/containers/SchemaAssistant/SchemaParameters";

export type SchemaParametersComponentProps = Partial<React.ComponentProps<typeof SchemaParameters>>;

export type SchemaParametersComponent = {
    defaultProps?: ComponentsPropsList['SchemaParameters'];
    styleOverrides?: ComponentsOverrides<Theme>['SchemaParameters'];
}

export type SchemaParametersComponentSlots =
    "root" | "driver" | "group" | "properties"
    ;
