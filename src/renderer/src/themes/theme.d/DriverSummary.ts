import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import DriverSummary from "@renderer/containers/SchemaAssistant/DriverSelect/DriverSummary";

export type DriverSummaryComponentProps = React.ComponentProps<typeof DriverSummary>;

export type DriverSummaryComponent = {
    defaultProps?: ComponentsPropsList['DriverSummary'];
    styleOverrides?: ComponentsOverrides<Theme>['DriverSummary'];
}

export type DriverSummaryComponentSlots =
    "root" | "icon"
    ;
