import { Box, BoxProps, Stack, StackProps, styled, Typography } from "@mui/material";
import { PasswordSetting } from "@renderer/components/settings/inputs/PasswordSetting";
import { PatternSetting } from "@renderer/components/settings/inputs/PatternSetting";
import { StringSetting } from "@renderer/components/settings/inputs/StringSetting";
import { TextSetting } from "@renderer/components/settings/inputs/TextSetting";
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
                    <StringSetting
                        path={["root"]}
                        setting={{
                            type: "string",
                            key: "some-setting",
                            group: "General",
                            title: "Jakieś ustawienie",
                            description: "This is a string setting",
                            required: true,
                            experimental: true,
                            advanced: true,
                            maxLength: 23,
                            minLength: 3,
                            effect: (values) => `Jakiś efekt wartości: **${values["some-setting"]}**`,
                            tags: ["example", "editable"],
                        }}
                        onChange={(value) => console.log(value)}
                        values={{ "some-setting": "wartość" }}
                        selected={selected}
                        onClick={() => setSelected(!selected)}
                    />
                    <TextSetting
                        path={["root"]}
                        setting={{
                            type: "text",
                            key: "some-text-setting",
                            group: "General",
                            title: "Jakieś ustawienie tekstowe",
                            description: "This is a text setting with multiple lines",
                            required: true,
                            experimental: true,
                            advanced: true,
                            maxLength: 100,
                            minRows: 1,
                            maxRows: 5,
                            effect: (values) => `Jakiś efekt wartości tekstowej: **${values["some-text-setting"]}**`,
                            tags: ["example", "editable"],
                        }}
                        onChange={(value) => console.log(value)}
                        values={{ "some-text-setting": "To jest przykładowa wartość tekstowa" }}
                    />
                    <PasswordSetting
                        path={["root"]}
                        setting={{
                            type: "password",
                            key: "some-password-setting",
                            group: "Security",
                            title: "Jakieś ustawienie hasła",
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
                            effect: (values) => `Jakiś efekt wartości hasła`,
                            tags: ["example", "editable"],
                        }}
                        onChange={(value) => console.log(value)}
                        values={{ "some-password-setting": "PrzykładoweHasło123!" }}
                    />
                    <PatternSetting
                        path={["root"]}
                        setting={{
                            type: "pattern",
                            key: "phone-number",
                            group: "General",
                            title: "Phone Number",
                            description: "Enter your phone number",
                            mask: "+0 (___) ___-__-__",
                            replacement: { "_": /\d/ },
                        }}
                        onChange={(value, valid) => console.log("Value:", value, "Valid:", valid)}
                        values={{ "phone-number": "+0 (123) 456-78-90" }}
                    />
                </StyledEditableSettingsList>
            </StyledEditableSettingsContent>
        </StyledEditableSettingsRoot>
    );
};

export default EditableSettings;