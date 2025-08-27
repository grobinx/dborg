import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import MenuBar from "@renderer/app/MenuBar";
import StatusBar from "@renderer/app/StatusBar";
import SchemaAssistant from "@renderer/containers/SchemaAssistant";

export type SchemaAssistantComponentProps = React.ComponentProps<typeof SchemaAssistant>;

export type SchemaAssistantComponent = {
    defaultProps?: ComponentsPropsList['SchemaAssistant'];
    styleOverrides?: ComponentsOverrides<Theme>['SchemaAssistant'];
}

export type SchemaAssistantComponentSlots =
    'root' | 'title' | 'buttons' | 'stepper' | 'content'
    ;
