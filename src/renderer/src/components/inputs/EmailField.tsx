import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { validateEmail, validateMaxLength, validateMinLength, validateRequired } from './base/useValidation';
import { BaseInputField } from './base/BaseInputField';

interface EmailFieldProps extends BaseInputProps {
    placeholder?: FormattedContentItem;
    maxLength?: number;
    minLength?: number;
    valiate?: boolean; 
    adornments?: React.ReactNode;
}

export const EmailField: React.FC<EmailFieldProps> = React.memo((props) => {
    const {
        value,
        maxLength,
        minLength,
        valiate = true, 
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
                type: 'email',
            }}
            validations={[
                (value: any) => validateMinLength(value, minLength),
                (value: any) => validateMaxLength(value, maxLength),
                valiate ? (value: any) => validateEmail(value) : undefined,
            ]}
            {...other}
        />
    )
});

EmailField.displayName = "EmailField";

