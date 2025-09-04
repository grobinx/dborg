import { ComponentsOverrides, Theme } from "@mui/material";
import { BaseInputProps } from "@renderer/components/inputs/base/BaseInputProps";

export type InputFieldComponentProps = Partial<BaseInputProps>;

export type InputFieldComponent = {
    //defaultProps?: ComponentsPropsList['InputField'];
    styleOverrides?: ComponentsOverrides<Theme>['InputField'];
}

export type InputFieldComponentSlots = 
    "root" 
    | "input" 
    | "adornment" 
    | "placeholder" 
    | "numberStepper" 
    | "sliderLegend"
    | "colorIndicator"
    ;
