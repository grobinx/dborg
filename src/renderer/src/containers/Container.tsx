import { Box, StackProps, styled, useThemeProps } from "@mui/material";
import React from "react";

export interface ContainerProps extends StackProps {
}

interface ContainerOwnProps extends ContainerProps {
}

const ContainerRoot = styled(Box, {
    name: 'Container', // The component name
    slot: 'root', // The slot name
})(() => ({
    height: "100%",
    width: "100%",
}));

const Container: React.FC<ContainerOwnProps> = (props) => {
    const { className, children, ...other } = useThemeProps({ name: 'Container', props });
    console.count("Container Render");
    return (
        <ContainerRoot
            {...other}
            className={(className ?? "") + " Container-root"}
        >
            {children}
        </ContainerRoot>
    );
}

export default Container;
