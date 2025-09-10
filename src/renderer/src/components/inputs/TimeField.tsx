import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { BaseInputField } from './base/BaseInputField';

interface TimeFieldProps extends BaseInputProps {
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const TimeField: React.FC<TimeFieldProps> = (props) => {
    const {
        value,
        inputProps,
        ...other
    } = props;

    const decorator = useInputDecorator();

    return (
        <BaseInputField
            value={value}
            inputProps={{
                type: 'time',
                ...inputProps,
            }}
            {...other}
        />
    )
};

TimeField.displayName = "TimeField";
