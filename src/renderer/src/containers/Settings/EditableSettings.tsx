import { Box, BoxProps, styled, Typography } from "@mui/material";
import { StringSetting } from "@renderer/components/settings/inputs/StringSetting";

export interface EditableSettingsProps extends BoxProps {
}

interface EditableSettingsOwnProps extends EditableSettingsProps {
}

const StyledEditableSettingsRoot = styled(Box, {
    name: 'EditableSettings', // The component name
    slot: 'root', // The slot name
})(() => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: "flex-start",
    alignItems: "flex-start",
    height: "100%",
    gap: 16,
    padding: 16,
    width: "90%",
    margin: "auto",
}));

const StyledEditableSettingsTitle = styled(Box, {
    name: 'EditableSettings', // The component name
    slot: 'title', // The slot name
})(() => ({
    width: "100%",
    display: "flex"
}));

const StyledEditableSettingsContent = styled(Box, {
    name: 'EditableSettings', // The component name
    slot: 'content', // The slot name
})(() => ({
    overflow: "auto",
    height: "100%",
    width: "95%",
    display: "flex",
    alignItems: "flex-start",
}));

const EditableSettings = (props: EditableSettingsOwnProps) => {
    const { ...other } = props;

    return (
        <StyledEditableSettingsRoot className="EditableSettings-root" {...other}>
            <StyledEditableSettingsTitle>
                <Typography variant="h4">
                    Editable Settings
                </Typography>
            </StyledEditableSettingsTitle>
            <StringSetting
                path={["root"]}
                setting={{
                    type: "string",
                    key: "some-setting",
                    title: "**Edycja:** Jakieś ustawienie",
                    description: "This is a string setting",
                    required: true,
                    experimental: true,
                    advanced: true,
                    minLength: 3,
                    effect: (values) => `Jakiś efekt wartości: ${values["some-setting"]}`,
                    validate: (value) => {
                        if (value.length < 3) {
                            return "Wartość musi mieć co najmniej 3 znaki";
                        }
                        return true;
                    },
                }}
            onChange={(value) => console.log(value)}
            values={{ "some-setting": "wartość" }}
            />
        </StyledEditableSettingsRoot>
    );
};

export default EditableSettings;