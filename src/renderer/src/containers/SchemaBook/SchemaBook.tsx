import { Box, BoxProps, styled, useThemeProps } from "@mui/material";
import React from "react";
import SchemaList from "./SchemaList";

export interface SchemaBookProps extends BoxProps {
}

interface SchemaBookOwnProps extends SchemaBookProps {
}

const SchemaBookRoot = styled(Box, {
    name: 'SchemaBook', // The component name
    slot: 'root', // The slot name
})(() => ({
    height: "100%",
    width: "100%",
}));

const SchemaBook: React.FC<SchemaBookOwnProps> = (props) => {
    const { hidden, className, children, ...other } = useThemeProps({ name: 'SchemaBook', props });
    return (
        <SchemaBookRoot
            {...other}
            className={(className ?? "") + " SchemaBook-root"}
            style={{ display: hidden ? "none" : "flex" }}
        >
            <SchemaList />
        </SchemaBookRoot>
    );
}

export default SchemaBook;
