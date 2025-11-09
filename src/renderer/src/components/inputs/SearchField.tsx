import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { validateMaxLength, validateMinLength } from './base/useValidation';
import { BaseInputField } from './base/BaseInputField';
import { useTheme } from '@mui/material';
import { TextField } from './TextField';

interface SearchFieldProps extends React.ComponentProps<typeof TextField> {
    autoCollapse?: boolean;
}

export const SearchField: React.FC<SearchFieldProps> = (props) => {
    const {
        value,
        maxLength,
        minLength,
        inputProps,
        ...other
    } = props;

    const theme = useTheme();
    const decorator = useInputDecorator();

    React.useEffect(() => {
        if (decorator && maxLength) {
            Promise.resolve().then(() => {
                decorator.setRestrictions([`${(value ?? "").length}/${maxLength}`]);
            });
        }
    }, [(value ?? "").length, decorator, maxLength]);

    return (
        <TextField
            value={value}
            inputProps={{
                maxLength,
                minLength,
                type: 'search',
                ...inputProps,
            }}
            {...other}
        />
    )
};

SearchField.displayName = "TextField";
