import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { validateMaxLength, validateMaxRows, validateMinLength, validateMinRows } from './base/useValidation';
import { BaseInputField } from './base/BaseInputField';

interface TextareaFieldProps extends Omit<BaseInputProps, 'inputProps'> {
    placeholder?: FormattedContentItem;
    maxLength?: number;
    minLength?: number;
    rows?: number;
    minRows?: number;
    maxRows?: number;
    adornments?: React.ReactNode;
    inputProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
    defaultValue?: string;
}

export const TextareaField: React.FC<TextareaFieldProps> = (props) => {
    const {
        value: controlledValue,
        onChange,
        maxLength,
        minLength,
        rows = 4,
        minRows,
        maxRows,
        inputProps,
        defaultValue,
        ...other
    } = props;

    const decorator = useInputDecorator();

    // Obsługa uncontrolled value
    const [uncontrolledValue, setUncontrolledValue] = React.useState<string | undefined>(defaultValue);
    const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;

    if (decorator && maxLength) {
        Promise.resolve().then(() => {
            decorator.setRestrictions(`${(value ?? "").length}/${maxLength}`);
        });
    }

    const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
        if (onChange) {
            onChange(e.currentTarget.value);
        } else {
            setUncontrolledValue(e.currentTarget.value);
        }
    };

    return (
        <BaseInputField
            value={value}
            type="textarea"
            inputProps={{
                ...inputProps,
                maxLength,
                minLength,
                rows,
                onChange: handleChange,
                style: { ...(inputProps?.style || {}), resize: 'none' },
            } as React.TextareaHTMLAttributes<HTMLTextAreaElement>}
            validations={[
                (value: any) => validateMinLength(value, minLength),
                (value: any) => validateMaxLength(value, maxLength),
                (value: any) => validateMinRows(value, minRows),
                (value: any) => validateMaxRows(value, maxRows),
            ]}
            {...other}
        />
    )
};

TextareaField.displayName = "TextareaField";
