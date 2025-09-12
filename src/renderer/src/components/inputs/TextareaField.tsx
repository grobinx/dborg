import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { validateMaxLength, validateMinLength } from './base/useValidation';
import { BaseInputField } from './base/BaseInputField';

interface TextareaFieldProps extends BaseInputProps {
    maxLength?: number;
    minLength?: number;
    rows?: number;
    adornments?: React.ReactNode;
    inputProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
}

export const TextareaField: React.FC<TextareaFieldProps> = (props) => {
    const {
        value,
        onChange,
        maxLength,
        minLength,
        rows = 4,
        inputProps,
        ...other
    } = props;

    const decorator = useInputDecorator();

    if (decorator && maxLength) {
        Promise.resolve().then(() => {
            decorator.setRestrictions(`${(value ?? "").length}/${maxLength}`);
        });
    }

    const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
        onChange?.(e.currentTarget.value);
    };

    return (
        <BaseInputField
            value={value}
            type="textarea"
            input={
                <textarea
                    value={value}
                    maxLength={maxLength}
                    minLength={minLength}
                    rows={rows}
                    onInput={handleChange}
                // onChange={(e) => {
                //     onChange?.(e.target.value);
                // }}
                //{...inputProps}
                />
            }
            validations={[
                (value: any) => validateMinLength(value, minLength),
                (value: any) => validateMaxLength(value, maxLength),
            ]}
            {...other}
        />
    )
};

TextareaField.displayName = "TextareaField";
