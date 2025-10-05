import { Box, Stack, StackProps, styled, Typography } from "@mui/material";
import editableSettingsRegistry from "@renderer/components/settings/EditableSettingsRegistry";
import { SettingsCollectionForm } from "@renderer/components/settings/SettingsForm";
import React from "react";
import Tree, { TreeNode } from './Tree'; // Importuj komponent Tree
import { SplitPanel, SplitPanelGroup, Splitter } from "@renderer/components/SplitPanel";
import { SettingsCollection, SettingsGroup } from "@renderer/components/settings/SettingsTypes";
import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { SearchField } from "@renderer/components/inputs/SearchField";
import { useTranslation } from "react-i18next";
import debounce from "@renderer/utils/debounce";
import { useSetting } from "@renderer/contexts/SettingsContext";

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
    alignItems: "center",
    gap: 8,
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

const searchSettings = (search: string, collections: SettingsCollection[]): SettingsCollection[] => {
    if (search.trim() === '') {
        return collections;
    }
    const parts = search.toLowerCase().split(' ').map(v => v.trim()).filter(v => v !== '');

    // Rekurencyjna funkcja do filtrowania grup i podgrup
    const filterGroups = (groups: SettingsGroup[] | undefined): SettingsGroup[] | undefined => {
        if (!groups) return undefined;
        const filtered = groups.map(group => {
            // Filtrowanie ustawień w grupie
            const matchedSettings = group.settings?.filter(setting =>
                parts.every(part =>
                    (typeof setting.label === 'string' && setting.label.toLowerCase().includes(part)) ||
                    (typeof setting.description === 'string' && setting.description.toLowerCase().includes(part))
                )
            );

            // Rekurencyjne filtrowanie podgrup
            const matchedGroups = filterGroups(group.groups);

            // Zwróć grupę tylko jeśli ma pasujące ustawienia lub podgrupy
            if ((matchedSettings && matchedSettings.length > 0) || (matchedGroups && matchedGroups.length > 0)) {
                return {
                    ...group,
                    settings: matchedSettings,
                    groups: matchedGroups
                };
            }
            return null;
        }).filter(Boolean) as SettingsGroup[];
        return filtered.length > 0 ? filtered : undefined;
    };

    const filtered = collections
        .map(collection => {
            const matchedGroups = filterGroups(collection.groups);
            return matchedGroups && matchedGroups.length > 0 ? {
                ...collection,
                groups: matchedGroups
            } : null;
        })
        .filter(Boolean) as SettingsCollection[];

    return filtered;
}

const EditableSettings = (props: EditableSettingsProps) => {
    const { ...other } = props;
    const [settingsCollections] = React.useState(() => editableSettingsRegistry.executeRegistrations());
    const [displaySettings, setDisplaySettings] = React.useState<SettingsCollection[]>(settingsCollections);
    const { t } = useTranslation();
    const [search, setSearch] = React.useState('');
    const [searchDelay] = useSetting<number>("app", "search.delay");

    React.useEffect(() => {
        const debouncedSearch = debounce(() => {
            setDisplaySettings(searchSettings(search, settingsCollections));
        }, searchDelay);
        debouncedSearch();
        return () => {
            debouncedSearch.cancel();
        };
    }, [search, settingsCollections]);

    const treeData = React.useMemo(() => buildTreeData(displaySettings), [displaySettings]);

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
                <Stack flexGrow={1} />
                <Box sx={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <InputDecorator indicator={false}>
                        <SearchField
                            placeholder={t("search---", "Search...")}
                            size="large"
                            autoFocus
                            value={search}
                            onChange={setSearch}
                        />
                    </InputDecorator>
                </Box>
            </StyledEditableSettingsTitle>
            <SplitPanelGroup direction="horizontal">
                <SplitPanel defaultSize={20}>
                    <Box sx={{ width: '100%', flexShrink: 0, padding: 8 }}>
                        <Tree data={treeData} onSelect={handleSelect} autoExpand={1} />
                    </Box>
                </SplitPanel>
                <Splitter />
                <SplitPanel>
                    <StyledEditableSettingsContent>
                        <StyledEditableSettingsList>
                            {displaySettings.length === 0 ? (
                                <StyledEditableSettingsContent>
                                    <Typography>
                                        {t("no-setting-results", "No settings found")}
                                    </Typography>
                                </StyledEditableSettingsContent>
                            ) : displaySettings.map((collection) => (
                                <SettingsCollectionForm
                                    key={collection.key}
                                    collection={collection}
                                />
                            ))}
                        </StyledEditableSettingsList>
                    </StyledEditableSettingsContent>
                </SplitPanel>
            </SplitPanelGroup >
        </StyledEditableSettingsRoot >
    );
};

export default EditableSettings;