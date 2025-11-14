import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import { ProfileList } from "@renderer/containers/SchemaBook";

export type ProfileListComponentProps = Partial<React.ComponentProps<typeof ProfileList>>;

export type ProfileListComponent = {
    styleOverrides?: ComponentsOverrides<Theme>['ProfileList'];
}

export type ProfileListComponentSlots =
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
