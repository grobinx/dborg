import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import { ProfileList } from "@renderer/containers/SchemaBook";

export type SchemaListComponentProps = Partial<React.ComponentProps<typeof ProfileList>>;

export type SchemaListComponent = {
    styleOverrides?: ComponentsOverrides<Theme>['SchemaList'];
}

export type SchemaListComponentSlots =
    | "root"
    | "container" 
    | "content" 
    | "title" 
    | "item"
    | "driverIcon" 
    | "statusIcon" 
    | "actionButtons" 
    | "groupHeader"
    | "groupName"
    | "profile"
    | "profileName"
    | "primaryText"
    | "secondaryText"
    | "sortActions"
    ;
