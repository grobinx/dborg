import { Box, BoxProps, styled, Typography } from "@mui/material";
import { StringSetting } from "@renderer/components/settings/inputs/StringSetting";
import { IconsList } from "@renderer/themes/icons";
import React from "react";

export interface DeveloperOptionsProps extends BoxProps {
}

interface DeveloperOptionsOwnProps extends DeveloperOptionsProps {
}

const StyledDeveloperOptionsRoot = styled(Box, {
    name: 'DeveloperOptions', // The component name
    slot: 'root', // The slot name
})(() => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: 16,
    padding: 16,
    width: "90%",
    margin: "auto",
}));

const StyledDeveloperOptionsTitle = styled(Box, {
    name: 'DeveloperOptions', // The component name
    slot: 'title', // The slot name
})(() => ({
    width: "100%",
    display: "flex"
}));

const StyledDeveloperOptionsContent = styled(Box, {
    name: 'DeveloperOptions', // The component name
    slot: 'content', // The slot name
})(() => ({
    overflow: "auto",
    height: "100%",
    width: "95%",
    display: "flex",
    alignItems: "flex-start",
}));

const DeveloperOptions = (props: DeveloperOptionsOwnProps) => {
    const { ...other } = props;
    const [selected, setSelected] = React.useState(false);

    return (
        <StyledDeveloperOptionsRoot className="DeveloperOptions-root" {...other}>
            <StyledDeveloperOptionsTitle>
                <Typography variant="h4">
                    Developer Options
                </Typography>
            </StyledDeveloperOptionsTitle>
            <IconsList />
        </StyledDeveloperOptionsRoot>
    );
};

export default DeveloperOptions;