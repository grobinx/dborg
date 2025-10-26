import { Box, BoxProps, Stack, styled, Typography } from "@mui/material";
import TabPanel from "@renderer/components/TabsPanel/TabPanel";
import TabsPanel from "@renderer/components/TabsPanel/TabsPanel";
import { InputFieldsContent } from "./developer/InputFields";
import { IconListContent } from "./developer/IconList";
import { ButtonsContent } from "./developer/Buttons";
import { ComponentsContent } from "./developer/Components";

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
                        itemID="developer-options-buttons"
                        content={<ButtonsContent />}
                        label="Buttons"
                    />
                    <TabPanel
                        itemID="developer-options-icons"
                        content={<IconListContent />}
                        label="Icons"
                    />
                    <TabPanel
                        itemID="developer-options-components"
                        content={<ComponentsContent />}
                        label="Components"
                    />
                </TabsPanel>
            </Stack>
        </StyledDeveloperOptionsRoot>
    );
};

export default DeveloperOptions;