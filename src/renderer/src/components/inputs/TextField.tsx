import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { validateMaxLength, validateMinLength } from './base/useValidation';
import { BaseInputField } from './base/BaseInputField';

interface StringFieldProps extends BaseInputProps {
    placeholder?: FormattedContentItem;
    maxLength?: number;
    minLength?: number;
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const StringField: React.FC<StringFieldProps> = (props) => {
    const {
        value,
        maxLength,
        minLength,
        inputProps,
        ...other
    } = props;

    const decorator = useInputDecorator();

    if (decorator && maxLength) {
        Promise.resolve().then(() => {
            decorator.setRestrictions(`${(value ?? "").length}/${maxLength}`);
        });
    }

    return (
        <BaseInputField
            value={value}
            inputProps={{
                maxLength,
                minLength,
                type: 'text',
                ...inputProps,
            }}
            validations={[
                (value: any) => validateMinLength(value, minLength),
                (value: any) => validateMaxLength(value, maxLength),
            ]}
            {...other}
        />
    )
};

StringField.displayName = "TextField";
