import { Box, Stack, StackProps, styled, Typography } from "@mui/material";
import editableSettingsRegistry from "@renderer/components/settings/EditableSettingsRegistry";
import { createKey, SettingsCollectionForm } from "@renderer/components/settings/SettingsForm";
import React from "react";
import Tree, { TreeNode } from './Tree'; // Importuj komponent Tree
import { SplitPanel, SplitPanelGroup, Splitter } from "@renderer/components/SplitPanel";
import { SettingsCollection, SettingsGroup, SettingTypeUnion } from "@renderer/components/settings/SettingsTypes";
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

const flattenSettings = (collections: SettingsCollection[]): SettingTypeUnion[] => {
    const flatList: SettingTypeUnion[] = [];

    const flatten = (groups?: SettingsGroup[]) => {
        if (!groups) return;
        groups.forEach(group => {
            // Dodaj ustawienia z grupy
            if (group.settings) {
                flatList.push(...group.settings);
            }
            // Rekurencyjnie spłaszcz podgrupy
            if (group.groups) flatten(group.groups);
        });
    };

    collections.forEach(collection => {
        // Dodaj ustawienia z kolekcji
        if (collection.settings) {
            flatList.push(...collection.settings);
        }
        // Spłaszcz grupy w kolekcji
        flatten(collection.groups);
    });

    return flatList;
}

const EditableSettings = (props: EditableSettingsProps) => {
    const { ...other } = props;
    const [settingsCollections] = React.useState(() => editableSettingsRegistry.executeRegistrations());
    const [displaySettings, setDisplaySettings] = React.useState<SettingsCollection[]>(settingsCollections);
    const [flatSettings, setFlatSettings] = React.useState<SettingTypeUnion[]>(() => flattenSettings(settingsCollections));
    const { t } = useTranslation();
    const [search, setSearch] = React.useState('');
    const [searchDelay] = useSetting<number>("app", "search.delay");
    const [selected, setSelected] = React.useState<string | null>(null);
    const selectedRef = React.useRef<string | null>(null);
    const settingsContentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const debouncedSearch = debounce(() => {
            const settings = searchSettings(search, settingsCollections);
            setDisplaySettings(settings);
            setFlatSettings(flattenSettings(settings));
            setSelected(null);
        }, searchDelay);
        debouncedSearch();
        return () => {
            debouncedSearch.cancel();
        };
    }, [search, settingsCollections]);

    const treeData = React.useMemo(() => buildTreeData(displaySettings), [displaySettings]);

    const handleSelectNode = React.useCallback((key: string) => {
        console.log("Wybrano węzeł:", key);
    }, []);

    const handleSelectSetting = React.useCallback((key: string) => {
        console.log("Wybrano ustawienie:", key);
        setSelected(key);
    }, []);

    React.useEffect(() => {
        selectedRef.current = selected;
    }, [selected]);

    const keyDownHandler = React.useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();

            if (selectedRef.current === null && flatSettings.length > 0) {
                setSelected(createKey(flatSettings[0]));
                return;
            }
            if (selectedRef.current === null) {
                return;
            }
            const currentIndex = flatSettings.findIndex(item => createKey(item) === selectedRef.current);
            const nextIndex = event.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1;
            const nextKey = flatSettings[nextIndex];
            if (nextKey) {
                setSelected(createKey(nextKey));
            }
            else if (flatSettings.length > 0) {
                setSelected(
                    event.key === 'ArrowDown' ?
                        createKey(flatSettings[0])
                        : createKey(flatSettings[flatSettings.length - 1])
                );
            }
        }
    }, [flatSettings]);

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
                            inputProps={{
                                onKeyDown: keyDownHandler
                            }}
                        />
                    </InputDecorator>
                </Box>
            </StyledEditableSettingsTitle>
            <SplitPanelGroup direction="horizontal">
                <SplitPanel defaultSize={20}>
                    <Box sx={{ width: '100%', flexShrink: 0, padding: 8 }}>
                        <Tree data={treeData} onSelect={handleSelectNode} autoExpand={1} />
                    </Box>
                </SplitPanel>
                <Splitter />
                <SplitPanel>
                    <StyledEditableSettingsContent ref={settingsContentRef}>
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
                                    contentRef={settingsContentRef}
                                    collection={collection}
                                    selected={selected ?? undefined}
                                    onSelect={handleSelectSetting}
                                    onPinned={(pinned) => {
                                        console.log("Pinned", pinned);
                                     }}
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