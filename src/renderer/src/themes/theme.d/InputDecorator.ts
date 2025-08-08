import { Theme } from "@emotion/react";
import { ComponentsOverrides } from "@mui/material";
import { BaseInputProps } from "@renderer/components/inputs/base/BaseInputProps";

export type InputDecoratorComponentProps = Partial<BaseInputProps>;

export type InputDecoratorComponent = {
    //defaultProps?: ComponentsPropsList['InputField'];
    styleOverrides?: ComponentsOverrides<Theme>['InputDecorator'];
}

export type InputDecoratorComponentSlots = 
    "root" 
    | "indicator" 
    | "container" 
    | "label" 
    | "labelText" 
    | "restrictions" 
    | "restriction" 
    | "description" 
    | "input" 
    | "validity"
    ;
