import { Box, BoxProps, styled, useThemeProps } from "@mui/material";
import React from "react";
import ProfileList from "./ProfileList";

export interface ProfileBookProps extends BoxProps {
}

interface ProfileBookOwnProps extends ProfileBookProps {
}

const ProfileBookRoot = styled(Box, {
    name: 'SchemaBook', // The component name
    slot: 'root', // The slot name
})(() => ({
    height: "100%",
    width: "100%",
}));

const ProfileBook: React.FC<ProfileBookOwnProps> = (props) => {
    const { hidden, className, children, ...other } = useThemeProps({ name: 'SchemaBook', props });
    return (
        <ProfileBookRoot
            {...other}
            className={(className ?? "") + " SchemaBook-root"}
            style={{ display: hidden ? "none" : "flex" }}
        >
            <ProfileList />
        </ProfileBookRoot>
    );
}

export default ProfileBook;
