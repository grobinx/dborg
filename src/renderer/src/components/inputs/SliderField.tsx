import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { styled, useTheme } from '@mui/material';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { validateMaxValue, validateMinValue } from './base/useValidation';
import { Adornment, BaseTextField } from './base/BaseTextField';
import clsx from '@renderer/utils/clsx';

interface SliderFieldProps extends BaseInputProps<number | undefined> {
    max?: number;
    min?: number;
    step?: number;
    adornments?: React.ReactNode;
}

const StyledBaseTextFieldSliderValue = styled('div', {
    name: "TextField",
    slot: "sliderValue",
})(() => ({
}));

export const SliderField: React.FC<SliderFieldProps> = (props) => {
    const {
        value,
        max = 100,
        min = 0,
        step,
        onChange,
        size,
        ...other
    } = props;

    const theme = useTheme();
    const decorator = useInputDecorator();

    React.useEffect(() => {
        if (decorator) {
            decorator.setRestrictions(`${min}-${max}`);
        }
    }, [decorator, min, max]);

    return (
        <BaseTextField
            value={value}
            size={size}
            inputProps={{
                max,
                min,
                step,
                type: 'range',
            }}
            onConvertToValue={(value: string) => {
                const numValue = parseFloat(value);
                return isNaN(numValue) ? undefined : numValue;
            }}
            onConvertToInput={(value: number | undefined) => {
                return value !== undefined ? String(value) : '';
            }}
            onChange={(newValue) => onChange?.(newValue)}
            inputAdornments={[
                <Adornment
                    key="slider-value"
                    position="input"
                    className={clsx(
                        "type-slider",
                    )}
                >
                    <StyledBaseTextFieldSliderValue className={clsx(
                        'TextField-sliderValue',
                        `power-${String(max).length}`
                    )}>
                        {value}
                    </StyledBaseTextFieldSliderValue>
                </Adornment>,
            ]}
            {...other}
        />
    );
};

