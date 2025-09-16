import { Box, InputLabel, MenuItem, Stack, Typography } from '@mui/material';
import React from 'react';
import { PropertyInfo } from '../../../../../api/db';
import { textFieldWidth } from './Utils';
import { useTranslation } from 'react-i18next';
import Tooltip from '@renderer/components/Tooltip';
import { ToolButton } from '@renderer/components/buttons/ToolButton';
import { PasswordField } from '@renderer/components/inputs/PasswordField';
import { Adornment } from '@renderer/components/inputs/base/BaseInputField';
import { SelectField } from '@renderer/components/inputs/SelectField';

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
    const { t } = useTranslation();

    const i18n_SchemaUsePassword = t("schema-use-password", "Use password");
    const i18n_AskPasswordOnConnect = t("ask-password-when-connecting", "Ask for password when connecting");
    const i18n_UseEmptyPassword = t("use-empty-password", "Use empty password");
    const i18n_SavePassword = t("save-password-as-plain-text", "Save password as plain text");

    return (
        <Stack direction={"row"} className="item">
            <Stack direction={"row"} gap={8}>
                <Box>
                    <InputLabel>{property.title}</InputLabel>
                    <PasswordField
                        id={property.name}
                        required={property.required}
                        value={value ?? ''}
                        disabled={usePassword !== "save"}
                        inputRef={passwordRef}
                        width={textFieldWidth(property.type, property.title)}
                        onChange={value => onChange(property, value)}
                    />
                    {property.description && (<Typography variant="description">{property.description}</Typography>)}
                </Box>
                <Box>
                    <InputLabel>{i18n_SchemaUsePassword}</InputLabel>
                    <SelectField
                        value={usePassword ?? "ask"}
                        onChange={value => onChangeUsePassword(value as SchemaUsePasswordType)}
                        width={textFieldWidth("string", i18n_SchemaUsePassword)}
                    >
                        <MenuItem key="ask" value="ask">{i18n_AskPasswordOnConnect}</MenuItem>
                        <MenuItem key="save" value="save">{i18n_SavePassword}</MenuItem>
                        <MenuItem key="empty" value="empty">{i18n_UseEmptyPassword}</MenuItem>
                    </SelectField>
                </Box>
            </Stack>
        </Stack>
    );
};

export default DriverPropertyPassword;
