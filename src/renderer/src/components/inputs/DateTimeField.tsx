import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { BaseInputField } from './base/BaseInputField';

interface DateTimeFieldProps extends BaseInputProps {
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const DateTimeField: React.FC<DateTimeFieldProps> = (props) => {
    const {
        inputProps,
        ...other
    } = props;

    const decorator = useInputDecorator();

    return (
        <BaseInputField
            inputProps={{
                type: 'datetime-local',
                ...inputProps,
            }}
            {...other}
        />
    )
};

DateTimeField.displayName = "DateTimeField";
