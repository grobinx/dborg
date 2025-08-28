import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import SchemaSummary from "@renderer/containers/SchemaAssistant/SchemaSummary/SchemaSummar";

export type SchemaSummaryComponentProps = Partial<React.ComponentProps<typeof SchemaSummary>>;

export type SchemaSummaryComponent = {
    defaultProps?: ComponentsPropsList['SchemaSummary'];
    styleOverrides?: ComponentsOverrides<Theme>['SchemaSummary'];
}

export type SchemaSummaryComponentSlots =
    "root" | "driver" | "schema"
    ;
