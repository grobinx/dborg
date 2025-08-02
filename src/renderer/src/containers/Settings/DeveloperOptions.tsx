import { Box, BoxProps, Stack, styled, Typography, useTheme } from "@mui/material";
import { PaletteColor, Size } from "@renderer/components/inputs/base/types";
import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { Adornment, TextField } from "@renderer/components/inputs/TextField";
import { IconsList } from "@renderer/components/settings/developer/IconList";
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
    const theme = useTheme();
    const [selected, setSelected] = React.useState<string | undefined>(undefined);
    const [values, setValues] = React.useState<Record<string, string>>({
        small: "small",
        medium: "medium",
        large: "large",
    });

    const handleValueChange = (size: string, value: string) => {
        setValues((prev) => ({
            ...prev,
            [size]: value, // Aktualizuj wartość dla danego rozmiaru
        }));
    };

    return (
        <StyledDeveloperOptionsRoot className="DeveloperOptions-root" {...other}>
            <StyledDeveloperOptionsTitle key="title">
                <Typography variant="h4">
                    Developer Options
                </Typography>
            </StyledDeveloperOptionsTitle>
            <Stack key="fields" direction="row" width="100%" gap={8}>
                {["small", "medium", "large"].map((size) => (
                    <Stack key={size} direction={"column"} width="100%">
                        Size: {size}
                        <InputDecorator
                            key={size}
                            selected={selected === size}
                            onClick={() => setSelected(size)}
                            label={"Label for " + size.charAt(0).toUpperCase() + size.slice(1)}
                            description={"This is Long Description for " + size.charAt(0).toUpperCase() + size.slice(1)}
                        >
                            <TextField
                                size={size as Size}
                                placeholder={"Placeholder for " + size.charAt(0).toUpperCase() + size.slice(1)}
                                maxLength={50}
                                value={values[size]} // Pobierz wartość dla danego rozmiaru
                                onChange={(_e, value) => handleValueChange(size, value)} // Aktualizuj wartość dla danego rozmiaru
                                adornments={[
                                    <Adornment key="connected" position="end">
                                        <theme.icons.Connected />
                                    </Adornment>,
                                    <Adornment key="clipboard" position="end">
                                        <theme.icons.Clipboard />
                                    </Adornment>

                                ]}
                                color="main"
                                required={true}
                                defaultValue={"dv"}
                            />
                        </InputDecorator>
                    </Stack>
                ))}
            </Stack>
            <IconsList key="icons" />
        </StyledDeveloperOptionsRoot>
    );
};

export default DeveloperOptions;