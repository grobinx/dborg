import React, { useState, useEffect, useRef, useMemo } from 'react';
import { List, ListItem, ListItemText, ListItemButton, Theme, useTheme, Menu, MenuItem, Paper, Divider, ListItemIcon, InputAdornment } from '@mui/material'; // Import komponentu Button
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
    const [searchText, setSearchText] = useState(initSearchText ?? '');
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<ActionGroup | null>(null); // Zmieniono na przechowywanie całej grupy
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listItemRef = useRef<HTMLLIElement>(null); // Referencja do elementu listy
    const listRef = useRef<HTMLUListElement>(null);
    const [listMaxHeight, setListMaxHeight] = useState<number>(300); // Domyślna maksymalna wysokość
    const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    // State for context menu
    const [contextMenu, setContextMenu] = useState<{ mouseX: number; mouseY: number } | null>(null);

    const handleClose = () => {
        onClose();
        setSearchText('');
        setSelectedGroup(null);
        parentRef?.current?.focus();
    };

    const handleOptionClick = (option: ActionGroupOption<any>) => {
        if (getContext) {
            option.run(getContext());
            Promise.resolve().then(() => {
                inputRef?.current?.focus();
            });
        }
    };

    // Handle context menu event
    useEffect(() => {
        const handleContextMenu = (event: MouseEvent) => {
            if (open) {
                // Jeśli okno jest widoczne, zablokuj menu kontekstowe
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

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
        };
    }, [open]);

    const handleContextMenuClose = () => {
        setContextMenu(null);
    };

    useEffect(() => {
        if (open && manager) {
            // Ustaw prefix w polu tekstowym przy otwarciu okna
            setSelectedIndex(null);
            let newSearchText = initSearchText ?? '';
            const matchingGroup = manager.getRegisteredActionGroups().find(({ prefix: pfx }) =>
                pfx === prefix
            );
            if (matchingGroup) {
                if (matchingGroup.getSearchText && getContext) {
                    newSearchText = matchingGroup.getSearchText(getContext());
                }
                if (matchingGroup.onOpen && getContext) {
                    matchingGroup.onOpen(getContext());
                }
            }
            setSearchText(prev => prev !== (prefix ?? '>') + (newSearchText) ? (prefix ?? '>') + (newSearchText) : prev);
            inputRef.current?.focus();
        }
    }, [open, manager]);

    useEffect(() => {
        if (!open || !manager) return; // Nie wykonuj operacji, jeśli okno jest zamknięte

        const matchingGroup = manager.getRegisteredActionGroups().find(({ prefix }) =>
            prefix && searchText.toLowerCase().startsWith(prefix.toLowerCase())
        );

        if (matchingGroup) {
            setSelectedGroup(prev => prev !== matchingGroup ? matchingGroup : prev); // Ustaw całą grupę
        } else {
            setSelectedGroup(null);
        }
    }, [open, searchText, manager]);

    // Always calculate filteredCommands, even if the component is not open
    const [filteredCommands, setFilteredCommands] = useState<Action<any>[]>([]);
    const cachedActions = useRef<Record<string, Action<any>[]>>({});

    useEffect(() => {
        if (!open) {
            cachedActions.current = {}; // Wyczyść pamięć podręczną po zamknięciu
        }
    }, [open]);

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        const context = getContext?.();

        console.debug("fetchCommands");

        const fetchCommands = async () => {
            if (!open || !manager) {
                setFilteredCommands([]);
                return;
            }

            // Usuń prefix z searchQuery, jeśli istnieje
            const queryWithoutPrefix = searchText.startsWith(selectedGroup?.prefix || '')
                ? searchText.slice((selectedGroup?.prefix || '').length).trim()
                : searchText;

            if (selectedGroup && (selectedGroup?.mode ?? "actions") === "actions") {
                // Tryb "actions": pobierz akcje tylko raz na zmianę `open`
                if (!cachedActions.current[selectedGroup.prefix || ""]) {
                    const actions = await manager.getRegisteredActions(selectedGroup.prefix, context);
                    cachedActions.current[selectedGroup.prefix || ""] = actions; // Zapisz w pamięci podręcznej
                }
                if (!signal.aborted) {
                    // Rozdziel query na fragmenty oddzielone spacją
                    const queryParts = queryWithoutPrefix.toLocaleLowerCase().split(' ').filter(Boolean);

                    const actions = cachedActions.current[selectedGroup.prefix || ""].filter((command) => {
                        const label = typeof command.label === "function" ? command.label(context) : command.label;
                        const secondaryLabel = command.description ? (typeof command.description === "function" ? command.description(context) : command.description) : '';
                        // Sprawdź, czy wszystkie fragmenty query pasują do label lub secondaryLabel
                        return queryParts.every((part) =>
                            label.toLocaleLowerCase().includes(part) ||
                            (secondaryLabel?.toLocaleLowerCase().includes(part) ?? false)
                        );
                    });
                    setFilteredCommands(actions);
                }
            } else {
                // Tryb "filter": pobierz akcje za każdym razem
                const actions = await manager.getRegisteredActions(selectedGroup?.prefix, context, queryWithoutPrefix);
                if (!signal.aborted) {
                    setFilteredCommands(actions);
                }
            }
        };

        fetchCommands();

        return () => {
            controller.abort();
        };
    }, [open, manager, searchText, selectedGroup]);

    useEffect(() => {
        console.debug("updateSelectedIndex");
        if (!open) return; // Nie wykonuj operacji, jeśli okno jest zamknięte

        // Znajdź indeks akcji, która ma właściwość selected ustawioną na true
        const selectedActionIndex = filteredCommands.findIndex(
            (action) => typeof action.selected === 'function' ? (
                getContext ? action.selected(getContext()) : false
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

    React.useEffect(() => {
        requestAnimationFrame(() => {
            const listItem = listRef.current?.querySelector<HTMLLIElement>('.focused');
            listItem?.scrollIntoView({ block: 'nearest' });
        });
    }, [selectedIndex]);

    const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            handleClose();
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Escape') {
            if (selectedGroup && selectedGroup.onCancel && getContext) {
                selectedGroup.onCancel(getContext());
            }
            handleClose();
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

        const items = selectedGroup
            ? filteredCommands
            : manager.getRegisteredActionGroups();

        // Pomocnicza funkcja do znalezienia następnego indeksu spełniającego ignoreAction
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
                if (nextIndex !== null) {
                    return nextIndex;
                }
                return prev;
            });
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedIndex(prev => {
                const current = prev === null ? items.length : prev;
                const nextIndex = findNextIndex(current, -1);
                if (nextIndex !== null) {
                    return nextIndex;
                }
                return prev;
            });
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
                if (nextIndex !== current) {
                    return nextIndex;
                }
                return prev;
            });
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
                if (nextIndex !== current) {
                    return nextIndex;
                }
                return prev;
            });
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
    };

    useEffect(() => {
        console.debug("addEventListener");
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            if (open) {
                document.removeEventListener('mousedown', handleClickOutside);
            }
        };
    }, [open, handleClose]);

    const handleCommandClick = (action: Action<any>) => {
        Promise.resolve().then(() => {
            if (getContext) {
                manager.executeAction(action, getContext());
                if (onAction) {
                    onAction(action);
                }
            }
        });
        handleClose();
    };

    // Helper function to group and sort context menu actions
    const [groupedContextMenuActions, setGroupedContextMenuActions] = useState<{ groupId: string; actions: Action<any>[]; }[]>([]);

    useEffect(() => {
        let isMounted = true;
        const context = getContext?.();

        console.debug("fetchContextMenuActions");

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
                if (!acc[groupId]) {
                    acc[groupId] = [];
                }
                acc[groupId].push(action);
                return acc;
            }, {} as Record<string, Action<any>[]>);

            const sortedGroups = Object.entries(grouped)
                .sort(([groupA], [groupB]) => {
                    if (groupA === "layout") return -1; // "layout" na początku
                    if (groupB === "layout") return 1;
                    if (groupA === "commandPalette") return 1; // "commandPalette" na końcu
                    if (groupB === "commandPalette") return -1;
                    return groupA.localeCompare(groupB); // Pozostałe grupy alfabetycznie
                })
                .map(([groupId, actions]) => ({
                    groupId,
                    actions: actions.sort((a, b) => {
                        const orderA = a.contextMenuOrder || 0;
                        const orderB = b.contextMenuOrder || 0;
                        const labelA = typeof a.label === 'function' ? a.label(context) : a.label;
                        const labelB = typeof b.label === 'function' ? b.label(context) : b.label;
                        return orderA - orderB || labelA.localeCompare(labelB); // Sortowanie po contextMenuOrder, a potem po label
                    }),
                }));

            if (isMounted) setGroupedContextMenuActions(sortedGroups);
        };
        fetchContextMenuActions();
        return () => { isMounted = false; };
    }, [manager]);

    useEffect(() => {
        console.debug("updateListMaxHeight");
        if (listItemRef.current && inputRef.current) {
            const itemHeight = listItemRef.current.offsetHeight;
            setListMaxHeight(itemHeight * 6); // Ustaw maksymalną wysokość na 6 pozycji
        }
    }, [filteredCommands]); // Wywołaj ponownie, gdy zmienią się komendy

    // Ensure all hooks are called, even if the component is not open
    useEffect(() => {
        console.debug("updatePosition");
        if (open && parentRef?.current) {
            const parentRect = parentRef.current.getBoundingClientRect();
            const containerWidth = containerRef.current?.offsetWidth || 0;
            const containerHeight = containerRef.current?.offsetHeight || 0;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let top = parentRect.top;
            let left = (parentRect.left + parentRect.width) / 2 - containerWidth / 2;

            // Jeśli pozycja grupy to "bottom", ustaw okno przy dolnej krawędzi
            if (selectedGroup?.position === "bottom") {
                top = parentRect.top + parentRect.height - containerHeight - 8; // 8px margines od dołu
            } else {
                // Korekta, by nie wychodziło poza ekran pionowo
                if (top + containerHeight > viewportHeight - 8) top = viewportHeight - containerHeight - 8;
                if (top < 8) top = 8;
            }

            // Korekta, by nie wychodziło poza ekran poziomo
            if (left < 8) left = 8;
            if (left + containerWidth > viewportWidth - 8) left = viewportWidth - containerWidth - 8;

            setPosition({ top, left });
        }
    }, [open, listMaxHeight, filteredCommands, selectedGroup]);

    const context = getContext?.();

    return (
        <>
            {open && (
                <CommandPaletteContainer
                    ref={containerRef}
                    style={{ top: position.top, left: position.left }}
                    elevation={4}
                >
                    <TextField
                        placeholder={selectedGroup ? "" : t("select-command-group-prefix", "Select command group prefix...")}
                        value={searchText}
                        onChange={(value) => setSearchText(prev => prev !== value ? value : prev)}
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
                    <CommandList
                        ref={listRef}
                        disablePadding
                        dense
                        maxHeight={listMaxHeight} // Ustaw dynamiczną maksymalną wysokość
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
                                            ref={index === 0 ? listItemRef : null} // Przypisz referencję do pierwszego elementu
                                            className={index === selectedIndex ? 'focused' : undefined}
                                            sx={{ opacity: disabled ? 0.5 : 1, display: visible ? 'block' : 'none' }}
                                        >
                                            <ListItemButton
                                                onClick={() => handleCommandClick(action)}
                                                selected={selected}
                                                disabled={disabled}
                                            >
                                                <ListItemIcon sx={{ color: 'inherit' }}>
                                                    {icon}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={highlightText(label, search, false, false, theme.palette.primary.main)}
                                                    secondary={highlightText(description, search, false, false, theme.palette.primary.main)}
                                                />
                                                {action.keybindings && <Shortcut keybindings={action.keybindings} />}
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
                                        />
                                    </ListItemButton>
                                </ListItem>
                            ))}
                    </CommandList>
                </CommandPaletteContainer>
            )}
            {/* Context Menu */}
            {(groupedContextMenuActions.length > 0) && (
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
                                        key={action.id}
                                        onClick={() => {
                                            handleContextMenuClose();
                                            handleCommandClick(action);
                                        }}
                                        dense
                                        disabled={disabled}
                                    >
                                        <ListItemIcon sx={{ color: 'inherit' }}>
                                            {resolveIcon(theme, typeof action.icon === "function" ? action.icon(context) : action.icon)}
                                        </ListItemIcon>
                                        <ListItemText>
                                            {label}
                                        </ListItemText>
                                        {action.keybindings && <Shortcut keybindings={action.keybindings} sx={{ ml: 8 }} />}
                                    </MenuItem>
                                </Tooltip>
                            )
                        }),
                    ])}
                </Menu>
            )}
        </>
    );
};

export default CommandPalette;