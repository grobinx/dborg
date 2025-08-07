import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { validateMaxLength, validateMinLength, validateRequired } from './base/useValidation';
import { BaseInputField } from './base/BaseInputField';
import { Replacement, useMask } from '@react-input/mask';
import { useTheme } from '@mui/material';

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
            {...other}
        />
    )
});

PatternField.displayName = "TextField";
