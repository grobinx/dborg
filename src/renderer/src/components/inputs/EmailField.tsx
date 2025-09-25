import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { validateEmail, validateMaxLength, validateMinLength } from './base/useValidation';
import { BaseInputField } from './base/BaseInputField';

interface EmailFieldProps extends BaseInputProps {
    placeholder?: FormattedContentItem;
    maxLength?: number;
    minLength?: number;
    validate?: boolean; 
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const EmailField: React.FC<EmailFieldProps> = (props) => {
    const {
        value,
        maxLength,
        minLength,
        validate = true, 
        inputProps,
        ...other
    } = props;

    const decorator = useInputDecorator();

    if (decorator && maxLength) {
        Promise.resolve().then(() => {
            decorator.setRestrictions([`${(value ?? "").length}/${maxLength}`]);
        });
    }

    return (
        <BaseInputField
            value={value}
            inputProps={{
                maxLength,
                minLength,
                type: 'email',
                ...inputProps,
            }}
            validations={[
                (value: any) => validateMinLength(value, minLength),
                (value: any) => validateMaxLength(value, maxLength),
                validate ? (value: any) => validateEmail(value) : undefined,
            ]}
            {...other}
        />
    )
};

EmailField.displayName = "EmailField";

