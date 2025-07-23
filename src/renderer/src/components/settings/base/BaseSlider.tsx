import { Slider, Stack } from "@mui/material";
import { BaseInputProps } from "./BaseInput";
import React from "react";


export interface BaseSliderProps extends
    Omit<React.ComponentProps<typeof Slider>, "onChange" | "value" | "disabled" | "onClick">,
    Partial<BaseInputProps> {
        width?: string | number;
}

const BaseSlider: React.FC<BaseSliderProps> = (props) => {
    const { id, value, onChange, disabled, width, ...other } = props;

    return (
        <Stack
            className="slider"
            sx={{ width }}
            direction="row"
            alignItems="center"
        >
            <span className="slider-value start">{value[0]}</span>
            <Slider
                id={id}
                value={value}
                onChange={(_event: Event, newValue: number | number[], activeThumb: number) => {
                    if (Array.isArray(newValue)) {
                        onChange?.(newValue, activeThumb);
                    }
                }}
                disabled={disabled}
                {...other}
            />
            <span className="slider-value end">{value[1]}</span>
        </Stack>
    );
};

export default BaseSlider;