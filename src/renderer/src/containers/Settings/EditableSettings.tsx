import { Box, Stack, StackProps, styled, Typography } from "@mui/material";
import editableSettingsRegistry from "@renderer/components/settings/EditableSettingsRegistry";
import { SettingsCollectionForm } from "@renderer/components/settings/SettingsForm";
import React from "react";
import Tree, { TreeNode } from './Tree'; // Importuj komponent Tree
import { SplitPanel, SplitPanelGroup, Splitter } from "@renderer/components/SplitPanel";
import { SettingsCollection, SettingsGroup } from "@renderer/components/settings/SettingsTypes";

export interface EditableSettingsProps extends StackProps {
}

const StyledEditableSettingsRoot = styled(Stack, {
    name: 'EditableSettings',
    slot: 'root',
})(() => ({
    padding: 16,
    width: "90%",
    height: "100%",
    margin: "auto",
    fontSize: "1rem"
}));

const StyledEditableSettingsTitle = styled(Box, {
    name: 'EditableSettings',
    slot: 'title',
})(({ theme }) => ({
    width: "100%",
    display: "flex",
    paddingLeft: 8,
    paddingBottom: 8,
    marginBottom: 8,
    borderBottom: `1px solid ${theme.palette.divider}`,
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
    display: 'flex',
}));

const StyledEditableSettingsList = styled(Stack, {
    name: 'EditableSettings',
    slot: 'list',
})(() => ({
    flexDirection: "column",
    paddingLeft: 8,
    paddingRight: 8,
    gap: 8,
}));

const buildTreeData = (collections: SettingsCollection[]): TreeNode[] => {
    const mapGroupsToTreeNodes = (groups: SettingsGroup[]): TreeNode[] => {
        return groups.map(group => ({
            key: group.key,
            title: group.title,
            children: group.groups ? mapGroupsToTreeNodes(group.groups) : [], // Rekurencyjne wywołanie dla podgrup
        }));
    };

    return collections.map(collection => ({
        key: collection.key,
        title: collection.title,
        children: collection.groups ? mapGroupsToTreeNodes(collection.groups) : [], // Wywołanie dla grup
    }));
};

const EditableSettings = (props: EditableSettingsProps) => {
    const { ...other } = props;
    const [settingsCollections] = React.useState(() => editableSettingsRegistry.executeRegistrations());

    const treeData = React.useMemo(() => buildTreeData(settingsCollections), [settingsCollections]);

    const handleSelect = (key: string) => {
        console.log("Wybrano:", key);
        // Możesz dodać logikę do obsługi wyboru
    };

    return (
        <StyledEditableSettingsRoot
            className="EditableSettings-root" {...other}
        >
            <StyledEditableSettingsTitle>
                <Typography variant="h4">
                    Settings
                </Typography>
            </StyledEditableSettingsTitle>
            <SplitPanelGroup direction="horizontal">
                <SplitPanel defaultSize={20}>
                    <Box sx={{ width: '100%', flexShrink: 0, padding: 8 }}>
                        <Tree data={treeData} onSelect={handleSelect} autoExpand={1} />
                    </Box>
                </SplitPanel>
                <Splitter />
                <SplitPanel>
                    <StyledEditableSettingsContent >
                        <StyledEditableSettingsList>
                            {settingsCollections.map((collection) => (
                                <SettingsCollectionForm
                                    key={collection.key}
                                    collection={collection}
                                />
                            ))}
                        </StyledEditableSettingsList>
                    </StyledEditableSettingsContent>
                </SplitPanel>
            </SplitPanelGroup>
        </StyledEditableSettingsRoot>
    );
};

export default EditableSettings;