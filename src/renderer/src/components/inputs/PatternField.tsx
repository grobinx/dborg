import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { validatePatternRequired } from './base/useValidation';
import { Adornment, BaseInputField } from './base/BaseInputField';
import { Replacement, useMask } from '@react-input/mask';
import { useTheme } from '@mui/material';
import { BaseButton } from '../buttons/BaseButton';

interface PatternFieldProps extends BaseInputProps {
    mask: string;
    replacement: Replacement;
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const PatternField: React.FC<PatternFieldProps> = React.memo((props) => {
    const {
        mask,
        replacement,
        required,
        ...other
    } = props;

    const inputRef = useMask({ mask, replacement, showMask: true });
    const theme = useTheme();

    return (
        <BaseInputField
            type='pattern'
            inputRef={inputRef}
            inputProps={{
                style: {
                    fontFamily: theme.typography.monospace.fontFamily,
                }
            }}
            validations={[
                required ? (value: any) => validatePatternRequired(value, mask) : undefined,
            ]}
            required={required}
            {...other}
        />
    )
});

PatternField.displayName = "TextField";
