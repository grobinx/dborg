import { ComponentsOverrides, Theme } from "@mui/material";
import { BaseInputProps } from "@renderer/components/inputs/base/BaseInputProps";
import { Shortcut } from "@renderer/components/Shortcut";

export type ShortcutComponentProps = Partial<React.ComponentProps<typeof Shortcut>>;

export type ShortcutComponent = {
    //defaultProps?: ComponentsPropsList['InputField'];
    styleOverrides?: ComponentsOverrides<Theme>['Shortcut'];
}

export type ShortcutComponentSlots = 
    "root" 
    | "chord"
    | "key"
    ;
