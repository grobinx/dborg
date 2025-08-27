import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import { DriverSelect } from "@renderer/containers/SchemaAssistant";

export type DriverSelectComponentProps = React.ComponentProps<typeof DriverSelect>;

export type DriverSelectComponent = {
    defaultProps?: ComponentsPropsList['DriverSelect'];
    styleOverrides?: ComponentsOverrides<Theme>['DriverSelect'];
}

export type DriverSelectComponentSlots =
    'root' | 'button' | 'icon'
    ;
