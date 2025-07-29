import { Box, Stack, StackProps, styled, Typography } from "@mui/material";
import { BooleanSetting } from "@renderer/components/settings/inputs/BooleanSetting";
import { ColorSetting } from "@renderer/components/settings/inputs/ColorSetting";
import { EmailSetting } from "@renderer/components/settings/inputs/EmailSetting";
import { NumberSetting } from "@renderer/components/settings/inputs/NumberSetting";
import { PasswordSetting } from "@renderer/components/settings/inputs/PasswordSetting";
import { PatternSetting } from "@renderer/components/settings/inputs/PatternSetting";
import { RangeSetting } from "@renderer/components/settings/inputs/RangeSetting";
import { StringSetting } from "@renderer/components/settings/inputs/StringSetting";
import { TextSetting } from "@renderer/components/settings/inputs/TextSetting";
import { escape } from "@renderer/components/useful/MarkdownTransform";
import { getSetting, setSetting, settingsGroups } from "@renderer/contexts/SettingsContext";
import React from "react";

export interface EditableSettingsProps extends StackProps {
}

interface EditableSettingsOwnProps extends EditableSettingsProps {
}

const StyledEditableSettingsRoot = styled(Stack, {
    name: 'EditableSettings',
    slot: 'root',
})(() => ({
    padding: 16,
    width: "90%",
    height: "100%",
    margin: "auto",
}));

const StyledEditableSettingsTitle = styled(Box, {
    name: 'EditableSettings', // The component name
    slot: 'title', // The slot name
})(() => ({
    width: "100%",
    display: "flex"
}));

const StyledEditableSettingsContent = styled(Stack, {
    name: 'EditableSettings',
    slot: 'content',
})(() => ({
    width: "100%",
    height: "100%",
    flexGrow: 1,
    overflowY: "auto",
    overflowX: "hidden",
}));

const StyledEditableSettingsList = styled(Stack, {
    name: 'EditableSettings',
    slot: 'list',
})(() => ({
    flexDirection: "column",
    padding: 8,
    gap: 8,
}));

const EditableSettings = (props: EditableSettingsOwnProps) => {
    const { ...other } = props;
    const [selected, setSelected] = React.useState(false);

    return (
        <StyledEditableSettingsRoot
            className="EditableSettings-root" {...other}
        >
            <StyledEditableSettingsTitle>
                <Typography variant="h4">
                    Editable Settings
                </Typography>
            </StyledEditableSettingsTitle>
            <StyledEditableSettingsContent>
                <StyledEditableSettingsList>
                    <NumberSetting
                        setting={{
                            type: "number",
                            storageGroup: "app",
                            key: "toast.max",
                            category: "General",
                            label: "Max Toasts",
                            description: "Select the maximum number of toasts to display",
                            min: 1,
                            max: 10,
                        }}
                    />
                    <StringSetting
                        setting={{
                            type: "string",
                            storageGroup: "test",
                            key: "some-setting",
                            category: "General",
                            label: "Jakieś ustawienie",
                            description: "This is a string setting",
                            required: true,
                            experimental: true,
                            advanced: true,
                            //maxLength: 23,
                            //minLength: 3,
                            effect: () => `Jakiś efekt wartości: **${escape(getSetting("test", "some-setting"))}**`,
                            tags: ["example", "editable"],
                        }}
                        selected={selected}
                        onClick={() => setSelected(!selected)}
                    />
                    <TextSetting
                        setting={{
                            type: "text",
                            storageGroup: "test",
                            key: "some-text-setting",
                            category: "General",
                            label: "Jakieś ustawienie tekstowe",
                            description: "This is a text setting with multiple lines",
                            required: true,
                            experimental: true,
                            advanced: true,
                            maxLength: 100,
                            minRows: 1,
                            maxRows: 5,
                            effect: () => `Jakiś efekt wartości tekstowej: **${escape(getSetting("test", "some-text-setting"))}**`,
                            tags: ["example", "editable"],
                        }}
                    />
                    <PasswordSetting
                        setting={{
                            type: "password",
                            storageGroup: "test",
                            key: "some-password-setting",
                            category: "Security",
                            label: "Jakieś ustawienie hasła",
                            description: "This is a password setting with validation",
                            required: true,
                            experimental: true,
                            advanced: true,
                            minLength: 8,
                            maxLength: 64,
                            atLeastOneLowercase: true,
                            atLeastOneUppercase: true,
                            atLeastOneDigit: true,
                            atLeastOneSpecialChar: true,
                            specialChars: "!@#$%^&*()_+[]{}|;:',.<>?/",
                            noSpaces: true,
                            canGenerate: true,
                            effect: () => `Jakiś efekt wartości hasła ${escape(getSetting("test", "some-password-setting"))}`,
                            tags: ["example", "editable"],
                        }}
                    />
                    <PatternSetting
                        setting={{
                            type: "pattern",
                            storageGroup: "test",
                            key: "phone-number",
                            category: "General",
                            label: "Phone Number",
                            description: "Enter your phone number",
                            mask: "+0 (___) ___-__-__",
                            replacement: { "_": /\d/ },
                            changed: (value) => {
                                setSetting("test", "phone", value.replace(/\D/g, ""));
                            }
                        }}
                    />
                    <StringSetting
                        setting={{
                            type: "string",
                            storageGroup: "test",
                            key: "phone",
                            category: "General",
                            label: "Phone",
                            description: "This is a phone setting",
                            disabled: true,
                        }}
                    />
                    <NumberSetting
                        setting={{
                            type: "number",
                            storageGroup: "test",
                            key: "age",
                            category: "General",
                            label: "Age",
                            description: "Select your age",
                            required: true,
                            //min: 0,
                            max: 1000,
                            defaultValue: 25,
                            effect: () => `Jakiś efekt wartości wieku : ${getSetting("test", "age")}`,
                        }}
                    />
                    <EmailSetting
                        setting={{
                            type: "email",
                            storageGroup: "test",
                            key: "email",
                            category: "General",
                            label: "Email Address",
                            description: "Enter your email address",
                        }}
                    />
                    <RangeSetting
                        setting={{
                            type: "range",
                            storageGroup: "test",
                            key: "age-range",
                            category: "General",
                            label: "Age Range",
                            description: "Select your age range",
                            min: 0,
                            max: 1000,
                            step: 10,
                            minDistance: 200,
                            effect: () => {
                                if (!getSetting("test", "age-range")) {
                                    return "No age range selected";
                                }
                                return `Jakiś efekt wartości zakresu wieku : ${getSetting("test", "age-range")[0]} - ${getSetting("test", "age-range")[1]}`;
                            },
                        }}
                    />
                    <ColorSetting
                        setting={{
                            type: "color",
                            storageGroup: "test",
                            key: "color",
                            category: "General",
                            label: "Color",
                            description: "Select a color",
                        }}
                    />
                    <BooleanSetting
                        setting={{
                            type: "boolean",
                            storageGroup: "test",
                            key: "notifications",
                            category: "General",
                            label: "Enable Notifications",
                            description: "Receive notifications for important updates\nBlended with the app theme",
                            defaultValue: true,
                        }}
                    />
                </StyledEditableSettingsList>
            </StyledEditableSettingsContent>
        </StyledEditableSettingsRoot>
    );
};

settingsGroups["test"] = {
    "some-setting": "wartość",
    "some-text-setting": "To jest przykładowa wartość tekstowa",
    "some-password-setting": "PrzykładoweHasło123!",
    "phone-number": "+0 (123) 456-78-90",
    "phone": "+1234567890",
    "email": "example@example.com",
    "age-range": [25, 450],
    //"age": 25,
    "color": "#ff0000",
};

export default EditableSettings;