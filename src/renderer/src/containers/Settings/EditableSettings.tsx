import { Box, Stack, StackProps, styled, Typography, useTheme } from "@mui/material";
import editableSettingsRegistry from "@renderer/components/settings/EditableSettingsRegistry";
import SettingsCollectionForm from "@renderer/components/settings/SettingsForm";
import React from "react";
import Tree, { TreeNode } from './Tree'; // Importuj komponent Tree
import { SplitPanel, SplitPanelGroup, Splitter } from "@renderer/components/SplitPanel";
import { SettingsCollection, SettingsGroup, SettingTypeUnion } from "@renderer/components/settings/SettingsTypes";
import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { SearchField } from "@renderer/components/inputs/SearchField";
import { useTranslation } from "react-i18next";
import debounce from "@renderer/utils/debounce";
import { useSetting } from "@renderer/contexts/SettingsContext";
import createKey from "@renderer/components/settings/createKey";
import { FormattedContentItem, FormattedText } from "@renderer/components/useful/FormattedText";
import UnboundBadge from "@renderer/components/UnboundBadge";

export interface EditableSettingsProps extends StackProps {
}

type SettingWithIndex = SettingTypeUnion & {
    _group: SettingsGroup | SettingsCollection;
    _index: number;
};

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
    const mapGroupsToTreeNodes = (groups: SettingsGroup[], parent?: TreeNode | null): TreeNode[] => {
        return groups.map(group => {
            const node: TreeNode = {
                key: group.key,
                title: group.title,
                parent
            };
            node.children = group.groups ? mapGroupsToTreeNodes(group.groups, node) : undefined;
            return node;
        });
    };

    return collections.map(collection => {
        const node: TreeNode = {
            key: collection.key,
            title: collection.title,
        };
        node.children = collection.groups ? mapGroupsToTreeNodes(collection.groups, node) : undefined;
        return node;
    });
};

const searchSettings = (search: string, collections: SettingsCollection[]): SettingsCollection[] => {
    if (search.trim() === '') {
        return collections;
    }
    const parts = search.toLowerCase().split(' ').map(v => v.trim()).filter(v => v !== '');

    const filterSettings = (settings: SettingTypeUnion[] | undefined, parts: string[]): SettingTypeUnion[] | undefined => {
        if (!settings) return undefined;
        return settings.filter(setting =>
            parts.every(part =>
                (typeof setting.label === 'string' && setting.label.toLowerCase().includes(part)) ||
                (typeof setting.description === 'string' && setting.description.toLowerCase().includes(part))
            )
        );
    };

    // Rekurencyjna funkcja do filtrowania grup i podgrup
    const filterGroups = (groups: SettingsGroup[] | undefined): SettingsGroup[] | undefined => {
        if (!groups) return undefined;
        const filtered = groups.map(group => {
            // Filtrowanie ustawień w grupie za pomocą nowej funkcji
            const matchedSettings = filterSettings(group.settings, parts);

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
            // Filtrowanie ustawień w kolekcji za pomocą nowej funkcji
            const matchedSettings = filterSettings(collection.settings, parts);

            const matchedGroups = filterGroups(collection.groups);
            return (matchedSettings && matchedSettings.length > 0) || (matchedGroups && matchedGroups.length > 0) ? {
                ...collection,
                settings: matchedSettings,
                groups: matchedGroups
            } : null;
        })
        .filter(Boolean) as SettingsCollection[];

    return filtered;
}

const flattenSettings = (collections: SettingsCollection[]): SettingWithIndex[] => {
    const flatList: SettingWithIndex[] = [];
    let index = 0;

    const flatten = (groups?: SettingsGroup[]) => {
        if (!groups) return;
        groups.forEach(group => {
            // Dodaj ustawienia z grupy
            if (group.settings) {
                flatList.push(...group.settings.map(setting => ({
                    ...setting,
                    _group: group,
                    _index: index++
                })));
            }
            // Rekurencyjnie spłaszcz podgrupy
            if (group.groups) flatten(group.groups);
        });
    };

    collections.forEach(collection => {
        // Dodaj ustawienia z kolekcji
        if (collection.settings) {
            flatList.push(...collection.settings.map(setting => ({
                ...setting,
                _group: collection,
                _index: index++
            })));
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
    const [flatSettings, setFlatSettings] = React.useState<SettingWithIndex[]>(() => flattenSettings(settingsCollections));
    const { t } = useTranslation();
    const [search, setSearch] = React.useState('');
    const [searchDelay] = useSetting<number>("app", "search.delay");
    const [selected, setSelected] = React.useState<string | null>(null);
    const selectedRef = React.useRef<string | null>(null);
    const settingsContentRef = React.useRef<HTMLDivElement>(null);
    const [pinnedMap, setPinnedMap] = React.useState<string[]>([]);
    const [breadCrumb, setBreadcrumb] = React.useState<FormattedContentItem[]>([]);
    const theme = useTheme();
    const [selectedNode, setSelectedNode] = React.useState<string | null>(null);

    React.useEffect(() => {
        const debouncedSearch = debounce(() => {
            const settings = searchSettings(search, settingsCollections);
            setDisplaySettings(settings);
            const flatSettings = flattenSettings(settings);
            setFlatSettings(flatSettings);
            setSelected(prev => {
                // Jeśli poprzednio zaznaczone ustawienie nie istnieje w nowych wynikach, ustaw na null
                if (prev && !flatSettings.some(item => createKey(item) === prev)) {
                    return null;
                }
                return prev;
            });
        }, searchDelay);
        debouncedSearch();
        return () => {
            debouncedSearch.cancel();
        };
    }, [searchDelay, search, settingsCollections]);

    const treeData = React.useMemo(() => buildTreeData(displaySettings), [displaySettings]);

    const handleSelectNode = React.useCallback((key: string) => {
        setSelectedNode(key);
    }, []);

    const handleSelectSetting = React.useCallback((key: string) => {
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

    React.useEffect(() => {
        const getPath = (node: TreeNode | null | undefined): TreeNode[] => {
            const path: TreeNode[] = [];
            while (node) {
                path.unshift(node);
                node = node.parent; // Przechodzimy do rodzica
            }
            return path;
        };

        const findNodeByKey = (nodes: TreeNode[], key: string): TreeNode | null => {
            for (const node of nodes) {
                if (node.key === key) return node;
                if (node.children && node.children.length > 0) {
                    const found = findNodeByKey(node.children, key);
                    if (found) return found;
                }
            }
            return null;
        };

        const updateBreadcrumb = debounce(() => {
            const pinnedSettings = pinnedMap.map(key => {
                return flatSettings.find(item => createKey(item) === key);
            });
            const minIndexSetting = pinnedSettings.reduce<SettingWithIndex | null>((min, curr) => {
                if (!curr) return min;
                if (!min || curr._index < min._index) return curr;
                return min;
            }, null);

            if (minIndexSetting) {
                const groupNode = findNodeByKey(treeData, minIndexSetting._group.key);
                const path = getPath(groupNode);
                setBreadcrumb(path.map(node => node.title));
                setSelectedNode(path[path.length - 1].key);
            }
            else {
                setBreadcrumb([]);
                setSelectedNode(null);
            }
        }, 100);

        updateBreadcrumb();

        return () => {
            updateBreadcrumb.cancel();
        };
    }, [pinnedMap, treeData, flatSettings]);

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
                    <StyledEditableSettingsContent>
                        <Box sx={{ width: '100%', height: '100%', flexShrink: 0, padding: 8 }}>
                            <Tree
                                data={treeData}
                                onSelect={handleSelectNode}
                                selected={selectedNode}
                                autoExpand={1}
                                renderNode={(node) => {
                                    return <FormattedText
                                        text={[[
                                            node.title,
                                            <UnboundBadge
                                                content={node.children?.length ?? 0}
                                                unmountOnHide
                                                style={{ opacity: 0.1 }}
                                            />
                                        ]]} />
                                }}
                            />
                        </Box>
                    </StyledEditableSettingsContent>
                </SplitPanel>
                <Splitter />
                <SplitPanel>
                    {displaySettings.length === 0 ? (
                        <StyledEditableSettingsContent>
                            <StyledEditableSettingsList>
                                {t("no-setting-results", "No settings found")}
                            </StyledEditableSettingsList>
                        </StyledEditableSettingsContent>
                    ) : (
                        <Stack direction="column" sx={{ height: "100%" }}>
                            <Typography variant="h6">
                                <Stack
                                    direction="row"
                                    sx={{
                                        padding: "0 8px",
                                        width: "100%",
                                        height: "48px",
                                        borderBottom: `1px solid ${theme.palette.divider}`,
                                        boxShadow: "0 4px 8px -4px rgba(0,0,0,0.12)",
                                        gap: 4,
                                        alignItems: "center",
                                    }}
                                    flexShrink={1}
                                    divider={<span>/</span>}
                                >
                                    {breadCrumb.map((item, index) => (
                                        <FormattedText key={index} text={item} />
                                    ))}
                                </Stack>
                            </Typography>
                            <StyledEditableSettingsContent ref={settingsContentRef} sx={{ flexGrow: 1, overflowY: "auto" }}>
                                <StyledEditableSettingsList>
                                    {displaySettings.map((collection) => (
                                        <SettingsCollectionForm
                                            key={collection.key}
                                            contentRef={settingsContentRef}
                                            collection={collection}
                                            selected={selected ?? undefined}
                                            onSelect={handleSelectSetting}
                                            onPinned={(operation, key) => {
                                                if (operation === 'add') {
                                                    setPinnedMap((prev) => [...prev, key]);
                                                } else {
                                                    setPinnedMap((prev) => {
                                                        if (!prev.includes(key)) return prev;
                                                        const newMap = [...prev];
                                                        newMap.splice(newMap.indexOf(key), 1);
                                                        return newMap;
                                                    });
                                                }
                                            }}
                                        />
                                    ))}
                                </StyledEditableSettingsList>
                            </StyledEditableSettingsContent>
                        </Stack>
                    )}
                </SplitPanel>
            </SplitPanelGroup >
        </StyledEditableSettingsRoot >
    );
};

export default EditableSettings;