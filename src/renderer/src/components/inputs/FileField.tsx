import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { Adornment, BaseInputField } from './base/BaseInputField';
import { IconButton } from '../buttons/IconButton';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Tooltip from '../Tooltip';
import { OpenDialogOptions } from 'electron';

interface FileFieldProps extends BaseInputProps {
    placeholder?: FormattedContentItem;
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    options?: OpenDialogOptions;
}

export const FileField: React.FC<FileFieldProps> = (props) => {
    const {
        value: controlledValue,
        onChange,
        size = "medium",
        color = "main",
        inputProps,
        options,
        ...other
    } = props;

    const decorator = useInputDecorator();
    const theme = useTheme();
    const { t } = useTranslation();
    const [uncontrolledValue, setUncontrolledValue] = React.useState<string | undefined>(undefined);
    const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;

    return (
        <BaseInputField
            value={value}
            type="file"
            size={size}
            color={color}
            inputProps={{
                type: 'text',
                ...inputProps,
            }}
            onChange={(value) => {
                if (onChange) {
                    onChange(value);
                } else {
                    setUncontrolledValue(value);
                }
            }}
            adornments={
                <Adornment position="end">
                    <Tooltip title={t("select-file", "Select file")}>
                        <IconButton
                            dense
                            size={size}
                            color={color}
                            onClick={() => {
                                window.electron.dialog.showOpenDialog({
                                    ...options
                                }).then(result => {
                                    if (!result.canceled && result.filePaths.length > 0) {
                                        if (onChange) {
                                            onChange(result.filePaths[0]);
                                        } else {
                                            setUncontrolledValue(result.filePaths[0]);
                                        }
                                    }
                                });
                            }}>
                            <theme.icons.OpenFile />
                        </IconButton>
                    </Tooltip>
                </Adornment>
            }
            {...other}
        />
    )
};

FileField.displayName = "FileField";
