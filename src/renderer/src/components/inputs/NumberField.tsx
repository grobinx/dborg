import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { IconButton, styled, useTheme } from '@mui/material';
import clsx from '../../utils/clsx';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { useValidation, validateMaxLength, validateMaxValue, validateMinLength, validateMinValue, validateRequired } from './base/useValidation';
import { o } from 'react-router/dist/development/fog-of-war-CvttGpNz';
import { Adornment, BaseTextField } from './base/BaseTextField';

interface NumberFieldProps extends BaseInputProps<number> {
    placeholder?: FormattedContentItem;
    max?: number;
    min?: number;
    step?: number;
    adornments?: React.ReactNode;
}

const StyledBaseTextField = styled('button', {
    name: "TextField",
    slot: "numberStepper",
})(() => ({
}));

export const NumberField: React.FC<NumberFieldProps> = (props) => {
    const {
        value,
        max,
        min,
        step,
        onChange,
        ...other
    } = props;

    const theme = useTheme();
    const decorator = useInputDecorator();

    React.useEffect(() => {
        if (decorator) {
            const restrictions: React.ReactNode[] = [];
            if (min !== undefined) {
                restrictions.push(`≥${min}`);
            }
            if (max !== undefined) {
                restrictions.push(`≤${max}`);
            }
            if (restrictions.length) {
                decorator.setRestrictions(restrictions);
            } else {
                decorator.setRestrictions(undefined);
            }
        }
    }, [decorator, min, max]);

    const handleIncrement = (e) => {
        const newValue = Math.min((value ?? 0) + (step ?? 1), max ?? Infinity);
        onChange?.(e, newValue);
    };

    const handleDecrement = (e) => {
        const newValue = Math.max((value ?? 0) - (step ?? 1), min ?? -Infinity);
        onChange?.(e, newValue);
    };

    return (
        <BaseTextField
            value={value}
            inputProps={{
                max,
                min,
                step,
                type: 'number',
            }}
            validations={[
                (value: any) => validateMinValue(value, min),
                (value: any) => validateMaxValue(value, max),
            ]}
            onChange={(e, newValue) => onChange?.(e, newValue)}
            inputAdornments={[
                <Adornment key="input" position="input" className='type-number'>
                    <StyledBaseTextField onClick={handleIncrement}>
                        <theme.icons.ExpandLess />
                    </StyledBaseTextField>
                    <StyledBaseTextField onClick={handleDecrement}>
                        <theme.icons.ExpandMore />
                    </StyledBaseTextField>
                </Adornment>,
            ]}
            {...other}
        />
    )
}

