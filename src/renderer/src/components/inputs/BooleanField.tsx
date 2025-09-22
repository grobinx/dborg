import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { BaseInputField } from './base/BaseInputField';
import { FormattedContentItem, FormattedText } from '../useful/FormattedText';
import { useTheme } from '@mui/material';
import { isTrue } from '@renderer/utils/booleans';

interface BooleanFieldProps extends BaseInputProps {
    value?: boolean | null;
    defaultValue?: boolean;
    onChange?: (value: boolean | null) => void;
    label?: FormattedContentItem
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    /**
     * Czy pole może mieć stan pośredni (null)
     * Jeśli tak, to kliknięcie w pole będzie cyklicznie zmieniać wartość między true, false i null
     * @default false
     */
    indeterminate?: boolean;
}

export const BooleanField: React.FC<BooleanFieldProps> = (props) => {
    const {
        value,
        label,
        color = "main",
        onChange,
        inputProps,
        indeterminate = false,
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
                    if (indeterminate) {
                        let next: boolean | null;
                        if (value === false) next = null;
                        else if (value === null) next = true;
                        else next = false;
                        onChange?.(next);
                    } else {
                        onChange?.(!value);
                    }
                },
                ...inputProps,
            }}
            onConvertToValue={(value: string | undefined) => {
                return isTrue(value);
            }}
            onConvertToInput={(value: boolean | undefined | null) => {
                return value !== undefined && value !== null ? String(value) : '';
            }}
            input={[
                <span key="icon" className="checkbox-icon">
                    {value === true ? (
                        <theme.icons.CheckBoxChecked color={color} />
                    ) : value === null ? (
                        <theme.icons.CheckBoxIndeterminate color={color} />
                    ) : (
                        <theme.icons.CheckBoxBlank color={color} />
                    )}
                </span>,
                <FormattedText key="label" text={label} />
            ]}
            {...other}
        />
    )
};

BooleanField.displayName = "BooleanField";
