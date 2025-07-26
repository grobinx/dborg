import { Box, BoxProps, Stack, StackProps, styled, Typography } from "@mui/material";
import { ColorSetting } from "@renderer/components/settings/inputs/ColorSetting";
import { EmailSetting } from "@renderer/components/settings/inputs/EmailSetting";
import { NumberSetting } from "@renderer/components/settings/inputs/NumberSetting";
import { PasswordSetting } from "@renderer/components/settings/inputs/PasswordSetting";
import { PatternSetting } from "@renderer/components/settings/inputs/PatternSetting";
import { RangeSetting } from "@renderer/components/settings/inputs/RangeSetting";
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
    padding: 8,
    gap: 8,
}));

const EditableSettings = (props: EditableSettingsOwnProps) => {
    const { ...other } = props;
    const [selected, setSelected] = React.useState(false);
    const [values, setValues] = React.useState<Record<string, any>>({
        "some-setting": "wartość",
        "some-text-setting": "To jest przykładowa wartość tekstowa",
        "some-password-setting": "PrzykładoweHasło123!",
        "phone-number": "+0 (123) 456-78-90",
        "email": "example@example.com",
        "age-range": [25, 450],
        //"age": 25,
        "color": "#ff0000",
    });

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
                        onChange={(value) => setValues((prev) => { prev["some-setting"] = value; return prev; })}
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
                        onChange={(value) => setValues((prev) => { prev["some-text-setting"] = value; return prev; })}
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
                            effect: (_values) => `Jakiś efekt wartości hasła`,
                            tags: ["example", "editable"],
                        }}
                        onChange={(value) => setValues((prev) => { prev["some-password-setting"] = value; return prev; })}
                        values={values}
                    />
                    <PatternSetting
                        path={["root"]}
                        setting={{
                            type: "pattern",
                            key: "phone-number",
                            group: "General",
                            label: "Phone Number",
                            description: "Enter your phone number",
                            mask: "+0 (___) ___-__-__",
                            replacement: { "_": /\d/ },
                        }}
                        onChange={(value) => setValues((prev) => { prev["phone-number"] = value; return prev; })}
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
                        onChange={(value) => setValues((prev) => { prev["email"] = value; return prev; })}
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
                        onChange={(value) => setValues((prev) => { prev["age-range"] = value; return prev; })}
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
                        onChange={(value) => setValues((prev) => { prev["age"] = value; return prev; })}
                        values={values}
                    />
                    <ColorSetting
                        path={["root"]}
                        setting={{
                            type: "color",
                            key: "color",
                            group: "General",
                            label: "Color",
                            description: "Select a color",
                        }}
                        onChange={(value) => setValues((prev) => { prev["color"] = value; return prev; })}
                        values={values}
                    />
                </StyledEditableSettingsList>
            </StyledEditableSettingsContent>
        </StyledEditableSettingsRoot>
    );
};

export default EditableSettings;