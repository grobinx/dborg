import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { validateMaxLength, validateMinLength } from './base/useValidation';
import { Adornment, BaseInputField } from './base/BaseInputField';
import { IconButton } from '../buttons/IconButton';
import { useTheme } from '@mui/material';
import Tooltip from '../Tooltip';
import { useTranslation } from 'react-i18next';

interface StringFieldProps extends BaseInputProps {
    placeholder?: FormattedContentItem;
    maxLength?: number;
    minLength?: number;
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const PasswordField: React.FC<StringFieldProps> = (props) => {
    const {
        value,
        maxLength,
        minLength,
        inputProps,
        size,
        inputRef,
        ...other
    } = props;

    const theme = useTheme();
    const [showPassword, setShowPassword] = React.useState(false);
    const decorator = useInputDecorator();
    const inputPasswordRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);
    const { t } = useTranslation();

    if (decorator && maxLength) {
        Promise.resolve().then(() => {
            decorator.setRestrictions([`${(value ?? "").length}/${maxLength}`]);
        });
    }

    return (
        <BaseInputField
            value={value}
            type="password"
            inputProps={{
                maxLength,
                minLength,
                type: showPassword ? 'text' : 'password',
                ...inputProps,
            }}
            validations={[
                (value: any) => validateMinLength(value, minLength),
                (value: any) => validateMaxLength(value, maxLength),
            ]}
            inputRef={(ref) => {
                inputPasswordRef.current = ref;
                if (typeof inputRef === 'function') {
                    inputRef(ref);
                }
                else if (inputRef && 'current' in inputRef) {
                    inputRef.current = ref;
                }
            }}
            inputAdornments={
                <Adornment position="end">
                    <Tooltip title={showPassword ? t("hide-password", "Hide password") : t("show-password", "Show password")}>
                        <IconButton
                            onClick={() => {
                                setShowPassword(!showPassword);
                                inputPasswordRef.current?.focus();
                            }}
                            size={size}
                            dense
                        >
                            {showPassword ? <theme.icons.VisibilityOff /> : <theme.icons.Visibility />}
                        </IconButton>
                    </Tooltip>
                </Adornment>
            }
            size={size}
            {...other}
        />
    )
};

PasswordField.displayName = "PasswordField";
