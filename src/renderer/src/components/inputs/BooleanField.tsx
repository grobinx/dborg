import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { BaseInputField } from './base/BaseInputField';
import { FormattedContentItem, FormattedText } from '../useful/FormattedText';
import { Box, Stack, useTheme } from '@mui/material';

interface BooleanFieldProps extends BaseInputProps {
    label?: FormattedContentItem
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const BooleanField: React.FC<BooleanFieldProps> = (props) => {
    const {
        value,
        label,
        onChange,
        inputProps,
        ...other
    } = props;

    const decorator = useInputDecorator();
    const theme = useTheme();

    const isTrue = (value: string) => {
        return ["true", "1", "yes", "on", "y"].includes((value ?? "").toLowerCase());
    }

    return (
        <BaseInputField
            value={value}
            type="boolean"
            inputProps={{
                type: 'checkbox',
                onClick: (_e) => {
                    onChange?.(!value);
                },
                ...inputProps,
            }}
            onConvertToValue={(value: string) => {
                return isTrue(value);
            }}
            onConvertToInput={(value: boolean | undefined | null) => {
                return value !== undefined && value !== null ? String(value) : '';
            }}
            input={[
                value ? <theme.icons.CheckBoxChecked /> : <theme.icons.CheckBoxBlank />,
                <FormattedText text={label} />
            ]}
            {...other}
        />
    )
};

BooleanField.displayName = "BooleanField";
