import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { styled } from '@mui/material';
import clsx from '../../utils/clsx';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { useValidation, validateMaxLength, validateMinLength, validateRequired } from './base/useValidation';
import { o } from 'react-router/dist/development/fog-of-war-CvttGpNz';
import { BaseTextField } from './base/BaseTextField';

interface TextFieldProps extends BaseInputProps {
    placeholder?: FormattedContentItem;
    maxLength?: number;
    minLength?: number;
    adornments?: React.ReactNode;
}

export const TextField: React.FC<TextFieldProps> = (props) => {
    const {
        value,
        maxLength,
        minLength,
        ...other
    } = props;

    const decorator = useInputDecorator();

    if (decorator && maxLength) {
        Promise.resolve().then(() => {
            decorator.setRestrictions(`${(value ?? "").length}/${maxLength}`);
        });
    }

    return (
        <BaseTextField
            value={value}
            inputProps={{
                maxLength,
                minLength,
                type: 'text',
            }}
            validations={[
                (value: any) => validateMinLength(value, minLength),
                (value: any) => validateMaxLength(value, maxLength),
            ]}
            {...other}
        />
    )
}

