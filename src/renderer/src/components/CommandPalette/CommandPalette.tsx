import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { List, ListItem, ListItemText, ListItemButton, Theme, useTheme, Menu, MenuItem, Paper, Divider, ListItemIcon, InputAdornment } from '@mui/material';
import { styled } from '@mui/system';
import { Action, ActionGroup, ActionGroupOption, ActionManager } from './ActionManager';
import { isKeybindingMatch, normalizeKeybinding, splitKeybinding } from './KeyBinding';
import { useTranslation } from 'react-i18next';
import { resolveIcon } from '@renderer/themes/icons';
import Tooltip from '../Tooltip';
import { ToolButton } from '../buttons/ToolButton';
import ButtonGroup from '../buttons/ButtonGroup';
import { Shortcut } from '../Shortcut';
import { TextField } from '../inputs/TextField';
import { Adornment } from '../inputs/base/BaseInputField';
import { highlightText } from '@renderer/hooks/useSearch';
import { InputDecorator } from '../inputs/decorators/InputDecorator';
import debounce from '@renderer/utils/debounce';
import { useSetting } from '@renderer/contexts/SettingsContext';

interface CommandPaletteProps {
    manager: ActionManager<any>;
    open: boolean;
    onAction?: (action: Action<any>) => void;
    getContext?: () => any;
    onClose: () => void;
    parentRef?: React.RefObject<HTMLElement | null>;
    prefix?: string;
    searchText?: string;
}

const CommandPaletteContainer = styled(Paper)(({ theme }) => ({
    position: 'fixed',
    width: '40%',
    zIndex: 1300,
    padding: theme.spacing(4),
    fontSize: '1rem',
    fontFamily: (theme.typography as any)?.fontFamily,
}));

const CommandList = styled(List, {
    shouldForwardProp: (prop) => prop !== "maxHeight",
})<{ maxHeight: number | null }>(({ theme, maxHeight }) => {
    return {
        maxHeight: maxHeight ? `${maxHeight}px` : "300px",
        overflowY: 'auto',
        marginTop: theme.spacing(1),
        color: theme.palette.text.primary,
    }
});

const CommandPalette: React.FC<CommandPaletteProps> = ({
    manager,
    open,
    onClose,
    onAction,
    getContext,
    parentRef,
    prefix,
    searchText: initSearchText,
}) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const [searchDelay] = useSetting<number>("app", "search.delay");
    const openRef = useRef(open);

    // ========== REFS ==========
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listItemRef = useRef<HTMLLIElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const onCloseRef = useRef(onClose);
    const getContextRef = useRef(getContext);
    const cachedActions = useRef<Record<string, Action<any>[]>>({});
    const debouncedFetchRef = useRef<ReturnType<typeof debounce> | null>(null);

    onCloseRef.current = onClose;
    getContextRef.current = getContext;

    // ========== STATE ==========
    const [searchText, setSearchText] = useState(initSearchText ?? '');
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<ActionGroup | null>(null);
    const [listMaxHeight, setListMaxHeight] = useState<number>(300);
    const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);
    const [filteredCommands, setFilteredCommands] = useState<Action<any>[]>([]);
    const [groupedContextMenuActions, setGroupedContextMenuActions] = useState<{ groupId: string; actions: Action<any>[]; }[]>([]);

    const context = getContextRef.current?.();
    const commandsHasIcons = useMemo(() => filteredCommands.some(action => !!action.icon), [filteredCommands]);

    // ========== CALLBACKS ==========

    const handleClose = useCallback(() => {
        onCloseRef.current();
        setSearchText('');
        setSelectedGroup(null);
        setFilteredCommands([]);
        setSelectedIndex(null);
        parentRef?.current?.focus();
        cachedActions.current = {};
    }, [parentRef]);

    const handleCommandClick = useCallback((action: Action<any>) => {
        if (getContextRef.current) {
            manager.executeAction(action, getContextRef.current());
            if (onAction) {
                onAction(action);
            }
        }
        handleClose();
    }, [manager, onAction, handleClose]);

    const handleOptionClick = useCallback((option: ActionGroupOption<any>) => {
        if (getContextRef.current) {
            option.run(getContextRef.current());
        }
        setTimeout(() => inputRef?.current?.focus(), 0);
    }, []);

    const fetchCommands = useCallback(async (
        manager: ActionManager<any>,
        searchText: string,
        selectedGroup: ActionGroup | null,
    ) => {
        const queryWithoutPrefix = searchText.startsWith(selectedGroup?.prefix || '')
            ? searchText.slice((selectedGroup?.prefix || '').length).trim()
            : searchText;

        if (selectedGroup) {
            if ((selectedGroup?.mode ?? "actions") === "actions") {
                if (!cachedActions.current[selectedGroup.prefix || ""]) {
                    const actions = await manager.getRegisteredActions(selectedGroup.prefix, getContextRef.current?.());
                    cachedActions.current[selectedGroup.prefix || ""] = actions;
                }
                const queryParts = queryWithoutPrefix.toLowerCase().split(' ').filter(Boolean);
                const actions = cachedActions.current[selectedGroup.prefix || ""].filter((command) => {
                    const label = typeof command.label === "function" ? command.label(getContextRef.current?.()) : command.label;
                    const description = command.description ? (typeof command.description === "function" ? command.description(context) : command.description) : '';
                    return queryParts.every((part) =>
                        label.toLowerCase().includes(part) ||
                        description.toLowerCase().includes(part)
                    );
                });
                setFilteredCommands(actions);
            } else {
                const actions = await manager.getRegisteredActions(selectedGroup?.prefix, getContextRef.current?.(), queryWithoutPrefix);
                setFilteredCommands(actions);
            }
        }
    }, [context]);

    // ========== EFFECTS ==========

    useEffect(() => {
        openRef.current = open;
    }, [open])

    useEffect(() => {
        if (!open || !manager || !prefix) return;

        // Znajdź grupę po nowym prefixie
        const matchingGroup = manager.getRegisteredActionGroups().find(({ prefix: pfx }) => pfx === prefix) ?? null;
        setSelectedGroup(matchingGroup);

        // Zachowaj część wpisaną przez użytkownika po prefiksie poprzedniej grupy
        const prevPrefix = selectedGroup?.prefix || '';
        const typedQuery = searchText.startsWith(prevPrefix)
            ? searchText.slice(prevPrefix.length).trim()
            : '';

        // Ustaw nowy searchText z nowym prefixem i poprzednim zapytaniem
        const newSearchText = (prefix ?? '') + (typedQuery ? ` ${typedQuery}` : '');
        setSearchText(newSearchText);

        // Wyczyść cache akcji, żeby nie blokować przełączenia grupy
        cachedActions.current = {};

        // Natychmiast pobierz akcje dla nowej grupy (bez debounce)
        (async () => {
            await fetchCommands(manager, newSearchText, matchingGroup);
            // Ustaw fokus na input i zresetuj zaznaczenie
            inputRef.current?.focus();
            setSelectedIndex(null);
        })();
    }, [open, manager, prefix]);

    useEffect(() => {
        console.debug("updateSelectedIndex");
        if (!open) return; // Nie wykonuj operacji, jeśli okno jest zamknięte

        // Znajdź indeks akcji, która ma właściwość selected ustawioną na true
        const selectedActionIndex = filteredCommands.findIndex(
            (action) => typeof action.selected === 'function' ? (
                getContextRef.current ? action.selected(getContextRef.current()) : false
            ) : false
        );

        if (selectedActionIndex !== -1) {
            setSelectedIndex(selectedActionIndex); // Ustaw selectedIndex na indeks wybranej akcji
        } else if (filteredCommands.length > 0) {
            setSelectedIndex(0); // Jeśli żadna akcja nie jest wybrana, ustaw na pierwszy element
        } else {
            setSelectedIndex(null); // Jeśli brak akcji, usuń zaznaczenie
        }
    }, [open, filteredCommands]);

    // Effect 1: Open/Close
    useEffect(() => {
        if (!open && openRef.current) {
            handleClose();
            return;
        }

        if (!manager) return;

        const matchingGroup = manager.getRegisteredActionGroups().find(({ prefix: pfx }) =>
            pfx === prefix
        );

        let newSearchText = initSearchText ?? '';
        if (matchingGroup) {
            if (matchingGroup.getSearchText && getContextRef.current) {
                newSearchText = matchingGroup.getSearchText(getContextRef.current());
            }
            if (matchingGroup.onOpen && getContextRef.current) {
                matchingGroup.onOpen(getContextRef.current());
            }
        }

        setSearchText((prefix ?? '>') + newSearchText);
        setSelectedGroup(matchingGroup ?? null);
        setSelectedIndex(null);
        inputRef.current?.focus();
    }, [open, manager, prefix, initSearchText, handleClose]);

    // Effect 2: Detect group from searchText prefix
    useEffect(() => {
        if (!open || !manager) return;

        const matchingGroup = manager.getRegisteredActionGroups().find(({ prefix }) =>
            prefix && searchText.toLowerCase().startsWith(prefix.toLowerCase())
        );

        setSelectedGroup(matchingGroup ?? null);
    }, [searchText, manager, open]);

    // Effect 3: Fetch commands with debounce
    useEffect(() => {
        if (!open || !selectedGroup) {
            setFilteredCommands([]);
            return;
        }

        debouncedFetchRef.current?.cancel();
        debouncedFetchRef.current = debounce(() => {
            fetchCommands(manager, searchText, selectedGroup);
        }, searchDelay);

        debouncedFetchRef.current();

        return () => {
            debouncedFetchRef.current?.cancel();
        };
    }, [open, selectedGroup, searchText, manager, fetchCommands, searchDelay]);

    // Effect 4: Scroll to selected item
    useEffect(() => {
        requestAnimationFrame(() => {
            const listItem = listRef.current?.querySelector<HTMLLIElement>('.focused');
            listItem?.scrollIntoView({ block: 'nearest' });
        });
    }, [selectedIndex]);

    // Effect 5: Update list item height
    useEffect(() => {
        if (listItemRef.current && inputRef.current) {
            const itemHeight = listItemRef.current.offsetHeight;
            setListMaxHeight(itemHeight * 6);
        }
    }, [filteredCommands]);

    // Effect 6: Update container position
    useEffect(() => {
        requestAnimationFrame(() => {
            if (!open || !parentRef?.current) return;

            const parentRect = parentRef.current.getBoundingClientRect();
            const containerWidth = containerRef.current?.offsetWidth || 0;
            const containerHeight = containerRef.current?.offsetHeight || 0;
            const vw = window.innerWidth;
            const vh = window.innerHeight;

            let top = parentRect.top;
            let left = (parentRect.left + parentRect.width / 2) - (containerWidth / 2);

            if (selectedGroup?.position === 'bottom') {
                top = parentRect.top + parentRect.height - containerHeight - 8;
            } else {
                if (top + containerHeight > vh - 8) top = vh - containerHeight - 8;
                if (top < 8) top = 8;
            }

            if (left < 8) left = 8;
            if (left + containerWidth > vw - 8) left = vw - containerWidth - 8;

            setPosition({ top, left });
        });
    }, [open, listMaxHeight, selectedGroup, parentRef]);

    // Effect 7: Click outside
    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, handleClose]);

    // Effect 8: Context menu
    useEffect(() => {
        const handleContextMenu = (event: MouseEvent) => {
            if (open) {
                event.preventDefault();
                return;
            }

            if (parentRef?.current && parentRef.current.contains(event.target as Node)) {
                event.preventDefault();
                setContextMenu({
                    mouseX: event.clientX - 2,
                    mouseY: event.clientY - 4,
                });
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, [open, parentRef]);

    // Effect 9: Fetch context menu actions
    useEffect(() => {
        let isMounted = true;

        const fetchContextMenuActions = async () => {
            if (!manager) {
                if (isMounted) setGroupedContextMenuActions([]);
                return;
            }

            const actionsWithGroup = (await manager.getRegisteredActions('>'))
                .filter(action => {
                    const visible = typeof action.visible === 'function' ? action.visible(context) : (action.visible ?? true);
                    return visible && action.contextMenuGroupId;
                });

            const grouped = actionsWithGroup.reduce((acc, action) => {
                const groupId = action.contextMenuGroupId!;
                if (!acc[groupId]) acc[groupId] = [];
                acc[groupId].push(action);
                return acc;
            }, {} as Record<string, Action<any>[]>);

            const sortedGroups = Object.entries(grouped)
                .sort(([groupA], [groupB]) => {
                    if (groupA === "layout") return -1;
                    if (groupB === "layout") return 1;
                    if (groupA === "commandPalette") return 1;
                    if (groupB === "commandPalette") return -1;
                    return groupA.localeCompare(groupB);
                })
                .map(([groupId, actions]) => ({
                    groupId,
                    actions: actions.sort((a, b) => {
                        const orderA = a.contextMenuOrder || 0;
                        const orderB = b.contextMenuOrder || 0;
                        const labelA = typeof a.label === 'function' ? a.label(context) : a.label;
                        const labelB = typeof b.label === 'function' ? b.label(context) : b.label;
                        return orderA - orderB || labelA.localeCompare(labelB);
                    }),
                }));

            if (isMounted) setGroupedContextMenuActions(sortedGroups);
        };

        fetchContextMenuActions();
        return () => { isMounted = false; };
    }, [manager, context]);

    // ========== KEYBOARD HANDLING ==========

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Escape') {
            if (selectedGroup && selectedGroup.onCancel && getContextRef.current) {
                selectedGroup.onCancel(getContextRef.current());
            }
            handleClose();
            return;
        }

        const ignoreAction = (index: number) => {
            if (selectedGroup) {
                const action = filteredCommands[index];
                const visible = typeof action.visible === 'function' ? action.visible(context) : (action.visible ?? true);
                const disabled = typeof action.disabled === 'function' ? action.disabled(context) : (action.disabled ?? false);
                return visible && !disabled;
            } else {
                const group = manager.getRegisteredActionGroups()[index];
                const disabled = typeof group.disabled === 'function' ? group.disabled(context) : (group.disabled ?? false);
                return !disabled;
            }
        };

        const items = selectedGroup ? filteredCommands : manager.getRegisteredActionGroups();

        const findNextIndex = (start: number, step: number) => {
            let idx = start;
            const len = items.length;
            for (let i = 0; i < len; i++) {
                idx = (idx + step + len) % len;
                if (ignoreAction(idx)) return idx;
            }
            return null;
        };

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedIndex(prev => {
                const current = prev === null ? -1 : prev;
                const nextIndex = findNextIndex(current, 1);
                return nextIndex !== null ? nextIndex : prev;
            });
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedIndex(prev => {
                const current = prev === null ? items.length : prev;
                const nextIndex = findNextIndex(current, -1);
                return nextIndex !== null ? nextIndex : prev;
            });
            return;
        }

        if (event.key === 'PageDown') {
            event.preventDefault();
            setSelectedIndex(prev => {
                let current = prev === null ? -1 : prev;
                let nextIndex = current;
                for (let i = 0; i < 5; i++) {
                    const candidate = findNextIndex(nextIndex, 1);
                    if (candidate !== null) nextIndex = candidate;
                }
                return nextIndex !== current ? nextIndex : prev;
            });
            return;
        }

        if (event.key === 'PageUp') {
            event.preventDefault();
            setSelectedIndex(prev => {
                let current = prev === null ? items.length : prev;
                let nextIndex = current;
                for (let i = 0; i < 5; i++) {
                    const candidate = findNextIndex(nextIndex, -1);
                    if (candidate !== null) nextIndex = candidate;
                }
                return nextIndex !== current ? nextIndex : prev;
            });
            return;
        }

        if (event.key === 'Enter' && selectedIndex !== null) {
            event.preventDefault();
            if (selectedGroup) {
                handleCommandClick(filteredCommands[selectedIndex]);
            } else {
                const selectedGroupItem = manager.getRegisteredActionGroups()[selectedIndex];
                if (selectedGroupItem) {
                    const disabled = typeof selectedGroupItem.disabled === 'function' ? selectedGroupItem.disabled(context) : (selectedGroupItem.disabled ?? false);
                    if (!disabled) {
                        setSearchText(selectedGroupItem.prefix || '');
                        setSelectedGroup(selectedGroupItem);
                    }
                }
            }
            return;
        }

        if (selectedGroup?.options?.length) {
            selectedGroup.options.some(option => {
                if (option.keybinding && isKeybindingMatch(normalizeKeybinding(option.keybinding), event)) {
                    event.preventDefault();
                    handleOptionClick(option);
                    return true;
                }
                return false;
            });
        }
    }, [selectedGroup, filteredCommands, selectedIndex, manager, context, handleCommandClick, handleOptionClick, handleClose]);

    // ========== RENDER ==========

    const handleContextMenuClose = useCallback(() => {
        setContextMenu(null);
    }, []);

    if (!open) {
        return (
            <Menu
                open={contextMenu !== null}
                onClose={handleContextMenuClose}
                anchorReference="anchorPosition"
                anchorPosition={
                    contextMenu !== null
                        ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
                        : undefined
                }
            >
                {groupedContextMenuActions.flatMap(({ groupId, actions }, groupIndex) => [
                    groupIndex > 0 && <Divider key={`divider-${groupId}`} />,
                    ...actions.map(action => {
                        const tooltip = typeof action.tooltip === "function" ? action.tooltip(context) : action.tooltip;
                        const disabled = typeof action.disabled === 'function' ? action.disabled(context) : (action.disabled ?? false);
                        const label = typeof action.label === "function" ? action.label(context) : action.label;
                        return (
                            <Tooltip key={action.id} title={tooltip || ''}>
                                <MenuItem
                                    onClick={() => {
                                        handleContextMenuClose();
                                        handleCommandClick(action);
                                    }}
                                    dense
                                    disabled={disabled}
                                >
                                    <ListItemIcon sx={{ color: 'inherit', minWidth: "2.2em" }}>
                                        {resolveIcon(theme, typeof action.icon === "function" ? action.icon(context) : action.icon)}
                                    </ListItemIcon>
                                    <ListItemText>{label}</ListItemText>
                                    {action.keySequence && <Shortcut keybindings={action.keySequence} sx={{ ml: 8 }} />}
                                </MenuItem>
                            </Tooltip>
                        )
                    }),
                ])}
            </Menu>
        );
    }

    return (
        <CommandPaletteContainer
            ref={containerRef}
            style={{ top: position.top, left: position.left }}
            elevation={4}
        >
            <InputDecorator indicator={false} disableBlink>
                <TextField
                    placeholder={selectedGroup ? "" : t("select-command-group-prefix", "Select command group prefix...")}
                    value={searchText}
                    onChange={setSearchText}
                    inputRef={inputRef}
                    onKeyDown={handleKeyDown}
                    adornments={
                        selectedGroup?.options?.length ? (
                            <Adornment position="end">
                                <ButtonGroup>
                                    {selectedGroup.options.map((option) => (
                                        <Tooltip
                                            key={option.id}
                                            title={
                                                [[
                                                    option.label,
                                                    option.keybinding && (<Shortcut keybindings={option.keybinding} />)
                                                ]]
                                            }
                                        >
                                            <ToolButton
                                                dense
                                                onClick={() => handleOptionClick(option)}
                                                selected={typeof option.selected === 'function' ? option.selected(context) : false}
                                                disabled={typeof option.disabled === 'function' ? option.disabled(context) : false}
                                            >
                                                {resolveIcon(theme, option.icon)}
                                            </ToolButton>
                                        </Tooltip>
                                    ))}
                                </ButtonGroup>
                            </Adornment>
                        ) : undefined
                    }
                />
            </InputDecorator>
            <CommandList
                ref={listRef}
                disablePadding
                dense
                maxHeight={listMaxHeight}
            >
                {selectedGroup
                    ? filteredCommands
                        .map((action, index) => {
                            const disabled = typeof action.disabled === 'function' ? action.disabled(context) : (action.disabled ?? false);
                            const visible = typeof action.visible === 'function' ? action.visible(context) : (action.visible ?? true);
                            const selected = index === selectedIndex || (typeof action.selected === 'function' ? action.selected(context) : false);
                            const label = typeof action.label === "function" ? action.label(context) : action.label;
                            const description = typeof action.description === "function" ? action.description(context) : action.description;
                            const icon = resolveIcon(theme, typeof action.icon === "function" ? action.icon(context) : action.icon);
                            const search = searchText.startsWith(selectedGroup?.prefix || '') ? searchText.slice((selectedGroup?.prefix || '').length).trim() : searchText;
                            return (
                                <ListItem
                                    key={action.id}
                                    disablePadding
                                    dense
                                    ref={index === 0 ? listItemRef : null}
                                    className={index === selectedIndex ? 'focused' : undefined}
                                    sx={{ opacity: disabled ? 0.7 : 1, display: visible ? 'block' : 'none' }}
                                >
                                    <ListItemButton
                                        onClick={() => handleCommandClick(action)}
                                        selected={selected}
                                        disabled={disabled}
                                    >
                                        {commandsHasIcons && (
                                            <ListItemIcon sx={{ color: 'inherit', minWidth: "2.2em" }}>
                                                {icon}
                                            </ListItemIcon>
                                        )}
                                        <ListItemText
                                            primary={(selectedGroup?.mode ?? "actions") === "actions" ? highlightText(label, search, false, false, theme.palette.primary.main) : label}
                                            secondary={(selectedGroup?.mode ?? "actions") === "actions" ? highlightText(description, search, false, false, theme.palette.primary.main) : description}
                                            slotProps={{
                                                primary: { variant: 'body1' },
                                                secondary: { variant: 'description' },
                                            }}
                                        />
                                        {action.keySequence && <Shortcut keybindings={action.keySequence} />}
                                    </ListItemButton>
                                </ListItem>
                            )
                        })
                    : manager.getRegisteredActionGroups().map((group, index) => (
                        <ListItem
                            key={group.prefix || index}
                            disablePadding
                            dense
                            className={index === selectedIndex ? 'focused' : undefined}
                        >
                            <ListItemButton
                                onClick={() => {
                                    const isDisabled = typeof group.disabled === 'function' ? group.disabled(context) : (group.disabled ?? false);
                                    if (isDisabled) return;
                                    setSearchText(group.prefix || '');
                                    setSelectedGroup(group);
                                }}
                                selected={index === selectedIndex}
                                disabled={typeof group.disabled === 'function' ? group.disabled(context) : (group.disabled ?? false)}
                            >
                                <ListItemText
                                    primary={group.label}
                                    slotProps={{
                                        primary: { variant: 'body1' },
                                        secondary: { variant: 'description' },
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
            </CommandList>
        </CommandPaletteContainer>
    );
};

export default CommandPalette;