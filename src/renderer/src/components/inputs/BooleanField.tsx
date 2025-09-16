import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { BaseInputField } from './base/BaseInputField';
import { FormattedContentItem, FormattedText } from '../useful/FormattedText';
import { Box, Stack, useTheme } from '@mui/material';
import { isTrue } from '@renderer/utils/booleans';

interface BooleanFieldProps extends BaseInputProps {
    value?: boolean;
    defaultValue?: boolean;
    onChange?: (value: boolean) => void;
    label?: FormattedContentItem
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const BooleanField: React.FC<BooleanFieldProps> = (props) => {
    const {
        value,
        label,
        color = "main",
        onChange,
        inputProps,
        ...other
    } = props;

    const theme = useTheme();

    return (
        <BaseInputField
            value={value}
            type="boolean"
            color={color}
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
                <span key="icon" className="checkbox-icon">{value ? <theme.icons.CheckBoxChecked color={color} /> : <theme.icons.CheckBoxBlank color={color} />}</span>,
                <FormattedText key="label" text={label} />
            ]}
            {...other}
        />
    )
};

BooleanField.displayName = "BooleanField";
