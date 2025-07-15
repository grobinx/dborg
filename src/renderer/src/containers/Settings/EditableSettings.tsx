import { Box, BoxProps, styled, Typography } from "@mui/material";

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

        </StyledEditableSettingsRoot>
    );
};

export default EditableSettings;