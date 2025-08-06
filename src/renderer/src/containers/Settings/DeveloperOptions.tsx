import { Box, BoxProps, Stack, styled, Typography, useTheme } from "@mui/material";
import { Adornment } from "@renderer/components/inputs/base/BaseInputField";
import { ThemeColor, Size } from "@renderer/components/inputs/base/types";
import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { NumberField } from "@renderer/components/inputs/NumberField";
import { SliderField } from "@renderer/components/inputs/SliderField";
import { TextField } from "@renderer/components/inputs/TextField";
import TabPanel from "@renderer/components/TabsPanel/TabPanel";
import TabsPanel from "@renderer/components/TabsPanel/TabsPanel";
import React from "react";
import { InputFieldsContent } from "./developer/InputFields";
import { IconListContent } from "./developer/IconList";

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
    height: "100%",
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

    return (
        <StyledDeveloperOptionsRoot className="DeveloperOptions-root" {...other}>
            <StyledDeveloperOptionsTitle key="title">
                <Typography variant="h4">
                    Developer Options
                </Typography>
            </StyledDeveloperOptionsTitle>
            <Stack key="content" direction="column" flex={1} height={0} width={"100%"}>
                <TabsPanel itemID="developer-options-tabs">
                    <TabPanel
                        itemID="developer-options-text-fields"
                        content={<InputFieldsContent />}
                        label="Input Fields"
                    />
                    <TabPanel
                        itemID="developer-options-icons"
                        content={<IconListContent />}
                        label="Icons"
                    />
                </TabsPanel>
            </Stack>
        </StyledDeveloperOptionsRoot>
    );
};

export default DeveloperOptions;