import { ComponentsOverrides, ComponentsPropsList, Theme } from "@mui/material";
import { CodeProps } from "@renderer/components/Code";

export type CodeComponent = {
    styleOverrides?: ComponentsOverrides<Theme>['Code'];
    defaultProps?: ComponentsPropsList['Code'];
};

export type CodeComponentSlots = "root";

export type CodeComponentProps = Partial<CodeProps>;

