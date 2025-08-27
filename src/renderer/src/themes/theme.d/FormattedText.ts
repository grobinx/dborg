import { ComponentsOverrides, Theme } from "@mui/material";
import { FormattedTextProps } from "@renderer/components/useful/FormattedText";

export type FormattedTextComponentProps = Partial<FormattedTextProps>;

export type FormattedTextComponent = {
    //defaultProps?: ComponentsPropsList['ToolButton'];
    styleOverrides?: ComponentsOverrides<Theme>['FormattedText'];
}

export type FormattedTextComponentSlots =
    "root"
    ;
