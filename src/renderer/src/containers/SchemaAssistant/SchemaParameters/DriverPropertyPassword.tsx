import { Box, FormHelperText, IconButton, InputAdornment, InputLabel, MenuItem, Stack, TextField, TextFieldProps, Typography, useTheme } from '@mui/material';
import React from 'react';
import { PropertyInfo } from '../../../../../api/db';
import { textFieldWidth } from './Utils';
import { useTranslation } from 'react-i18next';
import Tooltip from '@renderer/components/Tooltip';
import { ToolButton } from '@renderer/components/buttons/ToolButton';

export type SchemaUsePasswordType = "ask" | "save" | "empty" | undefined;

interface DriverPropertyFileProps {
    property: PropertyInfo,
    value: any,
    usePassword: SchemaUsePasswordType,
    onChange: (field: PropertyInfo, value: string) => void,
    onChangeUsePassword: (value: SchemaUsePasswordType) => void,
    passwordRef?: React.RefObject<HTMLInputElement | null>,
}

const DriverPropertyPassword: React.FC<DriverPropertyFileProps> = (props) => {
    const { property, value, usePassword, onChange, onChangeUsePassword, passwordRef } = props;
    const theme = useTheme();
    const [showPassword, setShowPassword] = React.useState(false);
    const { t } = useTranslation();

    const i18n_SchemaUsePassword = t("schema-use-password", "Use password");
    const i18n_AskPasswordOnConnect = t("ask-password-when-connecting", "Ask for password when connecting");
    const i18n_UseEmptyPassword = t("use-empty-password", "Use empty password");
    const i18n_SavePassword = t("save-password-as-plain-text", "Save password as plain text");

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    return (
        <Stack direction={"row"} className="item">
            <Stack direction={"row"} gap={8}>
                <Box>
                    <InputLabel>{property.title}</InputLabel>
                    <TextField
                        id={property.name}
                        required={property.required}
                        value={value ?? ''}
                        disabled={usePassword !== "save"}
                        type={showPassword ? 'text' : 'password'}
                        inputRef={passwordRef}
                        sx={{ width: textFieldWidth(property.type, property.title) }}
                        slotProps={{
                            input: {
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
                            },
                        }}
                        onChange={event => onChange(property, event.target.value)}
                    />
                    {property.description && (<Typography variant="description">{property.description}</Typography>)}
                </Box>
                <Box>
                    <InputLabel>{i18n_SchemaUsePassword}</InputLabel>
                    <TextField
                        key={"schema-use-password"}
                        select
                        value={usePassword ?? "ask"}
                        onChange={event => onChangeUsePassword(event.target.value as SchemaUsePasswordType)}
                        sx={{ width: textFieldWidth("string", i18n_SchemaUsePassword) }}
                    >
                        <MenuItem key="ask" value="ask">{i18n_AskPasswordOnConnect}</MenuItem>
                        <MenuItem key="save" value="save">{i18n_SavePassword}</MenuItem>
                        <MenuItem key="empty" value="empty">{i18n_UseEmptyPassword}</MenuItem>
                    </TextField>
                </Box>
            </Stack>
        </Stack>
    );
};

export default DriverPropertyPassword;
