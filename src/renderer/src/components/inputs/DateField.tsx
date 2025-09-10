import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { BaseInputField } from './base/BaseInputField';

interface DateFieldProps extends BaseInputProps {
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const DateField: React.FC<DateFieldProps> = (props) => {
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
                type: 'date',
                ...inputProps,
            }}
            {...other}
        />
    )
};

DateField.displayName = "DateField";
