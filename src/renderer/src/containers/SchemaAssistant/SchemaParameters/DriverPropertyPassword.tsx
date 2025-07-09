import { Box, IconButton, InputAdornment, MenuItem, TextField, TextFieldProps, Tooltip, useTheme } from '@mui/material';
import React from 'react';
import { PropertyInfo } from '../../../../../api/db';
import { textFieldWidth } from './Utils';
import { useTranslation } from 'react-i18next';
import ToolButton from '@renderer/components/ToolButton';

export type SchemaUsePasswordType = "ask" | "save" | "empty" | undefined;

interface DriverPropertyFileProps {
    property: PropertyInfo,
    value: any,
    usePassword: SchemaUsePasswordType,
    onChange: (field: PropertyInfo, value: string) => void,
    onChangeUsePassword: (value: SchemaUsePasswordType) => void,
    slotProps: {
        textField?: TextFieldProps,
    },
    passwordRef?: React.RefObject<HTMLInputElement | null>,
}

const DriverPropertyPassword: React.FC<DriverPropertyFileProps> = (props) => {
    const { property, value, usePassword, slotProps, onChange, onChangeUsePassword, passwordRef } = props;
    const { slotProps: textFieldSlotProps, ...textFieldOther } = slotProps?.textField ?? {};
    const { input: textFieldSlotPropsInput, ...textFieldSlotPropsOther } = textFieldSlotProps ?? {};
    const theme = useTheme();
    const [showPassword, setShowPassword] = React.useState(false);
    const { t } = useTranslation();

    const i18n_SchemaUsePassword = t("schema-use-password", "Use password");
    const i18n_AskPasswordOnConnect = t("ask-password-when-connecting", "Ask for password when connecting");
    const i18n_UseEmptyPassword = t("use-empty-password", "Use empty password");
    const i18n_SavePassword = t("save-password-as-plain-text", "Save password as plain text");

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    return (
        <Box>
            <TextField
                helperText={property.description}
                id={property.name}
                label={property.title}
                required={property.required}
                value={value ?? ''}
                disabled={usePassword !== "save"}
                type={showPassword ? 'text' : 'password'}
                inputRef={passwordRef}
                slotProps={{
                    input: {
                        sx: { minWidth: textFieldWidth(property.type, property.title) },
                        endAdornment: (
                            <InputAdornment
                                position="end"
                            >
                                <Tooltip title={showPassword ? t("hide-password", "Hide password") : t("show-password", "Show password")}>
                                    <span>
                                        <ToolButton
                                            disabled={usePassword !== "save"}
                                            onClick={handleClickShowPassword}
                                            selected={showPassword}
                                        >
                                            {showPassword ? <theme.icons.VisibilityOff /> : <theme.icons.Visibility />}
                                        </ToolButton>
                                    </span>
                                </Tooltip>
                            </InputAdornment>
                        ),
                        ...textFieldSlotPropsInput
                    },
                    ...textFieldSlotPropsOther
                }}
                onChange={event => onChange(property, event.target.value)}
                {...textFieldOther}
            />
            <TextField
                key={"schema-use-password"}
                label={i18n_SchemaUsePassword}
                select
                value={usePassword ?? "ask"}
                onChange={event => onChangeUsePassword(event.target.value as SchemaUsePasswordType)}
                slotProps={{
                    input: {
                        sx: {
                            minWidth: textFieldWidth("string", i18n_SchemaUsePassword),
                        },
                        ...textFieldSlotPropsInput,
                    },
                    ...textFieldSlotPropsOther
                }}
                {...textFieldOther}
            >
                <MenuItem key="ask" value="ask">{i18n_AskPasswordOnConnect}</MenuItem>
                <MenuItem key="save" value="save">{i18n_SavePassword}</MenuItem>
                <MenuItem key="empty" value="empty">{i18n_UseEmptyPassword}</MenuItem>
            </TextField>
        </Box>
    );
};

export default DriverPropertyPassword;
