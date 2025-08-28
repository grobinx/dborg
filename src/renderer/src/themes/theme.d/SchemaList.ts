import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import { SchemaList } from "@renderer/containers/SchemaBook";

export type SchemaListComponentProps = Partial<React.ComponentProps<typeof SchemaList>>;

export type SchemaListComponent = {
    defaultProps?: ComponentsPropsList['SchemaList'];
    styleOverrides?: ComponentsOverrides<Theme>['SchemaList'];
}

export type SchemaListComponentSlots =
    "root" | "content" | "title"
    ;
