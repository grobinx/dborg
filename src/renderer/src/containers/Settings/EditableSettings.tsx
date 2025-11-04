import { Box, Stack, StackProps, styled, Typography, useTheme } from "@mui/material";
import editableSettingsRegistry from "@renderer/components/settings/SettingsRegistry";
import React from "react";
import Tree, { TreeNode } from '../../components/Tree'; // Importuj komponent Tree
import { SplitPanel, SplitPanelGroup, Splitter } from "@renderer/components/SplitPanel";
import { SettingsCollection, SettingsGroup, SettingTypeUnion } from "@renderer/components/settings/SettingsTypes";
import { InputDecorator } from "@renderer/components/inputs/decorators/InputDecorator";
import { SearchField } from "@renderer/components/inputs/SearchField";
import { useTranslation } from "react-i18next";
import debounce from "@renderer/utils/debounce";
import { useSetting } from "@renderer/contexts/SettingsContext";
import createKey from "@renderer/components/settings/createKey";
import { FormattedContentItem, FormattedText } from "@renderer/components/useful/FormattedText";
import { useKeyboardNavigation } from "@renderer/hooks/useKeyboardNavigation";
import { focusElement } from "@renderer/components/useful/FocusContainerHandler";
import SettingsView from "@renderer/components/settings/SettingsForm";

export interface EditableSettingsProps {
}

type SettingWithIndex = SettingTypeUnion & {
    _group: SettingsGroup | SettingsCollection;
    _index: number;
};

type TreeNodeWithParent = TreeNode & {
    parent?: TreeNodeWithParent | null;
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

const buildTreeData = (collections: SettingsCollection[]): TreeNodeWithParent[] => {
    const mapGroupsToTreeNodes = (groups: SettingsGroup[], parent?: TreeNodeWithParent | null): TreeNodeWithParent[] => {
        return groups.map(group => {
            const node: TreeNodeWithParent = {
                key: group.key,
                title: group.title,
                parent
            };
            node.children = group.groups ? mapGroupsToTreeNodes(group.groups, node) : undefined;
            return node;
        });
    };

    return collections.map(collection => {
        const node: TreeNodeWithParent = {
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
    const { ...rest } = props;
    const [settingsCollections] = React.useState(() => editableSettingsRegistry.executeRegistrations());
    const [displaySettings, setDisplaySettings] = React.useState<SettingsCollection[]>(settingsCollections);
    const [flatSettings, setFlatSettings] = React.useState<SettingWithIndex[]>(() => flattenSettings(settingsCollections));
    const { t } = useTranslation();
    const theme = useTheme();
    const [search, setSearch] = React.useState('');
    const [searchDelay] = useSetting<number>("app", "search.delay");
    const [selected, setSelected, handleSearchKeyDown] = useKeyboardNavigation({
        items: flatSettings,
        getId: createKey,
        onEnter: React.useCallback((item: SettingTypeUnion) => {
            if (settingsContentRef.current) {
                const element = settingsContentRef.current?.querySelector(`[data-setting-key="${createKey(item)}"] :first-child`);
                if (element) {
                    focusElement(element as HTMLElement);
                }
            }
        }, []),
    });
    const settingsContentRef = React.useRef<HTMLDivElement>(null);
    const [pinnedMap, setPinnedMap] = React.useState<string[]>([]);
    const [breadCrumb, setBreadcrumb] = React.useState<FormattedContentItem[]>([]);
    const [selectedNode, setSelectedNode] = React.useState<string | undefined>(undefined);
    const [manualSelectedNode, setManualSelectedNode] = React.useState<string | undefined>(undefined);

    const treeNodes = React.useMemo(() => buildTreeData(displaySettings), [displaySettings]);

    const handleSelectNode = React.useCallback((key: string) => {
        setSelectedNode(key);
        setManualSelectedNode(key);
    }, []);

    // Aktualizuj breadcrumb TYLKO na podstawie pinnedMap (nie selectedNode)
    React.useEffect(() => {
        const getPath = (node: TreeNodeWithParent | null | undefined): TreeNodeWithParent[] => {
            const path: TreeNodeWithParent[] = [];
            while (node) {
                path.unshift(node);
                node = node.parent;
            }
            return path;
        };

        const findNodeByKey = (nodes: TreeNodeWithParent[], key: string): TreeNodeWithParent | null => {
            for (const node of nodes) {
                if (node.key === key) return node;
                if (node.children && node.children.length > 0) {
                    const found = findNodeByKey(node.children, key);
                    if (found) return found;
                }
            }
            return null;
        };

        // Tylko pinnedMap wpływa na breadcrumb i selectedNode
        if (pinnedMap.length === 0) {
            setBreadcrumb([]);
            // NIE ustawiaj selectedNode tutaj jeśli był manualny wybór
            if (!manualSelectedNode) {
                setSelectedNode(undefined);
            }
            return;
        }

        const pinnedSettings = pinnedMap.map(key => {
            return flatSettings.find(item => createKey(item) === key);
        });
        const minIndexSetting = pinnedSettings.reduce<SettingWithIndex | null>((min, curr) => {
            if (!curr) return min;
            if (!min || curr._index < min._index) return curr;
            return min;
        }, null);

        if (minIndexSetting) {
            const groupNode = findNodeByKey(treeNodes, minIndexSetting._group.key);
            const path = getPath(groupNode);
            React.startTransition(() => {
                setBreadcrumb(path.map(node => node.title));
                if (!manualSelectedNode) {
                    setSelectedNode(path[path.length - 1].key);
                }
            });
        }
    }, [pinnedMap, treeNodes, flatSettings, manualSelectedNode]);

    React.useEffect(() => {
        setManualSelectedNode(undefined);
    }, [selected]);

    React.useEffect(() => {
        const debouncedSearch = debounce(() => {
            const settings = searchSettings(search, settingsCollections);
            const flatSettings = flattenSettings(settings);

            React.startTransition(() => {
                setDisplaySettings(settings);
                setFlatSettings(flatSettings);
                setSelected(prev => {
                    // Jeśli poprzednio zaznaczone ustawienie nie istnieje w nowych wynikach, ustaw na null
                    if (prev && !flatSettings.some(item => createKey(item) === prev)) {
                        return null;
                    }
                    return prev;
                });
            });
        }, searchDelay);
        debouncedSearch();
        return () => {
            debouncedSearch.cancel();
        };
    }, [searchDelay, search, settingsCollections]);

    const handleSelectSetting = React.useCallback((key: string) => {
        setSelected(key);
    }, []);

    const handlePinned = React.useCallback((operation: 'add' | 'remove', key: string) => {
        setPinnedMap((prev) => {
            if (operation === 'add') {
                return [...prev, key];
            } else {
                if (!prev.includes(key)) {
                    return prev;
                }
                const newMap = [...prev];
                newMap.splice(newMap.indexOf(key), 1);
                return newMap;
            }
        });
    }, []);

    const renderNode = React.useCallback((node: TreeNodeWithParent) => {
        return <FormattedText
            text={node.title}
        // text={[[
        //     node.title,
        //     <UnboundBadge
        //         content={node.children?.length ?? 0}
        //         unmountOnHide
        //         style={{ opacity: 0.5 }}
        //         size="medium"
        //     />
        // ]]}
        />
    }, []);

    return (
        <StyledEditableSettingsRoot
            className="EditableSettings-root" {...rest}
        >
            <StyledEditableSettingsTitle>
                <Typography variant="h4">
                    {t("settings", "Settings")}
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
                                onKeyDown: handleSearchKeyDown
                            }}
                            storeId="settings-search-field"
                        />
                    </InputDecorator>
                </Box>
            </StyledEditableSettingsTitle>
            <SplitPanelGroup direction="horizontal">
                <SplitPanel defaultSize={20}>
                    <Tree
                        nodes={treeNodes}
                        onSelect={handleSelectNode}
                        selected={selectedNode}
                        autoExpand={1}
                        renderNode={renderNode}
                        color="default"
                        size="default"
                        dense
                    />
                </SplitPanel>
                <Splitter />
                <SplitPanel>
                    <Stack direction="column" sx={{ height: "100%", width: "100%" }}>
                        <Stack
                            direction="row"
                            sx={{
                                ...theme.typography.h6,
                                padding: "8px 8px",
                                width: "100%",
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                boxShadow: "0 4px 8px -4px rgba(0,0,0,0.12)",
                                gap: 4,
                                alignItems: "center",
                            }}
                        >
                            {breadCrumb.map((item, index) => (
                                <React.Fragment key={index}>
                                    {index > 0 && <span key={`sep-${index}`}>/</span>}
                                    <FormattedText text={item} />
                                </React.Fragment>
                            ))}
                        </Stack>
                        <SettingsView
                            collections={displaySettings}
                            ref={settingsContentRef}
                            selected={selected ?? undefined}
                            onSelect={handleSelectSetting}
                            onPinned={handlePinned}
                            selectedGroup={manualSelectedNode}
                        />
                    </Stack>
                </SplitPanel>
            </SplitPanelGroup >
        </StyledEditableSettingsRoot >
    );
};

export default EditableSettings;