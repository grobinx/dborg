import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { BaseInputField } from './base/BaseInputField';

interface BooleanFieldProps extends BaseInputProps {
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const BooleanField: React.FC<BooleanFieldProps> = (props) => {
    const {
        value,
        inputProps,
        ...other
    } = props;

    const decorator = useInputDecorator();

    return (
        <BaseInputField
            value={value}
            type="boolean"
            inputProps={{
                type: 'checkbox',
                ...inputProps,
            }}
            onConvertToValue={(value: string) => {
                return ["true", "1", "yes", "on", "y"].includes(value.toLowerCase());
            }}
            onConvertToInput={(value: boolean | undefined | null) => {
                return value !== undefined && value !== null ? String(value) : '';
            }}
            {...other}
        />
    )
};

BooleanField.displayName = "BooleanField";
