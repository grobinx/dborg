import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { validateMaxLength, validateMinLength, validateRequired } from './base/useValidation';
import { Adornment, BaseInputField } from './base/BaseInputField';
import { Collapse, useTheme } from '@mui/material';

interface SearchFieldProps extends BaseInputProps {
    placeholder?: FormattedContentItem;
    maxLength?: number;
    minLength?: number;
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const SearchField: React.FC<SearchFieldProps> = React.memo((props) => {
    const {
        value,
        maxLength,
        minLength,
        inputProps,
        ...other
    } = props;

    const theme = useTheme();
    const decorator = useInputDecorator();
    const inputRef = React.useRef<HTMLInputElement>(null);

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
                type: 'search',
                ...inputProps,
            }}
            validations={[
                (value: any) => validateMinLength(value, minLength),
                (value: any) => validateMaxLength(value, maxLength),
            ]}
            inputRef={inputRef}
            adornments={
                <Adornment
                    key="search"
                    position="end"
                    onClick={() => {
                        if (inputRef.current) {
                            inputRef.current.focus();
                        }
                    }}
                >
                    <theme.icons.Search />
                </Adornment>
            }
            {...other}
        />
    )
});

SearchField.displayName = "TextField";
