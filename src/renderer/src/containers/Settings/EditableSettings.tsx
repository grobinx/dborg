import { Box, Stack, StackProps, styled, Typography } from "@mui/material";
import { ColorSetting } from "@renderer/components/settings/inputs/ColorSetting";
import { EmailSetting } from "@renderer/components/settings/inputs/EmailSetting";
import { NumberSetting } from "@renderer/components/settings/inputs/NumberSetting";
import { PasswordSetting } from "@renderer/components/settings/inputs/PasswordSetting";
import { PatternSetting } from "@renderer/components/settings/inputs/PatternSetting";
import { RangeSetting } from "@renderer/components/settings/inputs/RangeSetting";
import { StringSetting } from "@renderer/components/settings/inputs/StringSetting";
import { TextSetting } from "@renderer/components/settings/inputs/TextSetting";
import { setSetting, settingsGroups, useSetting, useSettings } from "@renderer/contexts/SettingsContext";
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
    const [values, setValues] = useSettings<Record<string, any>>("test");
    const [toastMax, setToastMax] = useSetting<number | undefined>("app", "toast.max");
    const [phone, setPhone] = useSetting<string | undefined>("test", "phone");

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
                        path={["root"]}
                        setting={{
                            type: "number",
                            key: "toast.max",
                            group: "General",
                            label: "Max Toasts",
                            description: "Select the maximum number of toasts to display",
                            min: 1,
                            max: 10,
                            defaultValue: settingsGroups["app"]["toast.max"],
                        }}
                        onChange={(value) => setToastMax(value)}
                        values={{ "toast.max": toastMax }}
                    />
                    <StringSetting
                        path={["root"]}
                        setting={{
                            type: "string",
                            key: "some-setting",
                            group: "General",
                            label: "Jakieś ustawienie",
                            description: "This is a string setting",
                            required: true,
                            experimental: true,
                            advanced: true,
                            //maxLength: 23,
                            //minLength: 3,
                            effect: (values) => `Jakiś efekt wartości: **${values["some-setting"]}**`,
                            tags: ["example", "editable"],
                        }}
                        onChange={(value) => setValues("some-setting", value)}
                        values={values}
                        selected={selected}
                        onClick={() => setSelected(!selected)}
                    />
                    <TextSetting
                        path={["root"]}
                        setting={{
                            type: "text",
                            key: "some-text-setting",
                            group: "General",
                            label: "Jakieś ustawienie tekstowe",
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
                        onChange={(value) => setValues("some-text-setting", value)}
                        values={values}
                    />
                    <PasswordSetting
                        path={["root"]}
                        setting={{
                            type: "password",
                            key: "some-password-setting",
                            group: "Security",
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
                            effect: (_values) => `Jakiś efekt wartości hasła ${_values["some-password-setting"]}`,
                            tags: ["example", "editable"],
                        }}
                        onChange={(value) => setValues("some-password-setting", value)}
                        values={values}
                    />
                    <PatternSetting
                        path={["test"]}
                        setting={{
                            type: "pattern",
                            key: "phone-number",
                            group: "General",
                            label: "Phone Number",
                            description: "Enter your phone number",
                            mask: "+0 (___) ___-__-__",
                            replacement: { "_": /\d/ },
                            changed: (value, values) => {
                                setSetting("test", "phone", value.replace(/\D/g, ""));
                            }
                        }}
                        onChange={(value) => setValues("phone-number", value)}
                        values={values}
                    />
                    <StringSetting
                        path={["test"]}
                        setting={{
                            type: "string",
                            key: "phone",
                            group: "General",
                            label: "Phone",
                            description: "This is a phone setting",
                            disabled: true,
                        }}
                        //onChange={(value) => setValues((prev) => { prev["phone"] = value; return prev; })}
                        values={values}
                    />
                    <NumberSetting
                        path={["root"]}
                        setting={{
                            type: "number",
                            key: "age",
                            group: "General",
                            label: "Age",
                            description: "Select your age",
                            required: true,
                            //min: 0,
                            max: 1000,
                            defaultValue: 25,
                            effect: (values) => `Jakiś efekt wartości wieku : ${values["age"]}`,
                        }}
                        onChange={(value) => setValues("age", value)}
                        values={values}
                    />
                    <EmailSetting
                        path={["root"]}
                        setting={{
                            type: "email",
                            key: "email",
                            group: "General",
                            label: "Email Address",
                            description: "Enter your email address",
                        }}
                        onChange={(value) => setValues("email", value)}
                        values={values}
                    />
                    <RangeSetting
                        path={["root"]}
                        setting={{
                            type: "range",
                            key: "age-range",
                            group: "General",
                            label: "Age Range",
                            description: "Select your age range",
                            min: 0,
                            max: 1000,
                            step: 10,
                            minDistance: 200,
                            effect: (values) => `Jakiś efekt wartości zakresu wieku : ${values["age-range"][0]} - ${values["age-range"][1]}`,
                        }}
                        onChange={(value) => setValues("age-range", value)}
                        values={values}
                    />
                    {/*
                    <ColorSetting
                        path={["root"]}
                        setting={{
                            type: "color",
                            key: "color",
                            group: "General",
                            label: "Color",
                            description: "Select a color",
                        }}
                        onChange={(value) => setValues((prev) => ({ ...prev, "color": value }))}
                        values={values}
                    />
                     */}
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