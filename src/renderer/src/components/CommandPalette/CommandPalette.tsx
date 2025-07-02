import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TextField, List, ListItem, ListItemText, ListItemButton, Theme, useTheme, Menu, MenuItem, Paper, Divider, ListItemIcon, InputAdornment, Tooltip, ButtonGroup } from '@mui/material'; // Import komponentu Button
import { styled } from '@mui/system';
import { ActionDescriptor, ActionGroupDescriptor, ActionGroupOptionDescription, ActionManager } from './ActionManager';
import { isKeybindingMatch, normalizeKeybinding, splitKeybinding } from './KeyBinding';
import { useTranslation } from 'react-i18next';
import { resolveIcon } from '@renderer/themes/icons';
import ToolButton from '../ToolButton';

interface CommandPaletteProps {
    manager: ActionManager<any>;
    open: boolean;
    onAction?: (action: ActionDescriptor<any>) => void;
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
    fontSize: '1.2rem'
}));

const CommandList = styled(List, {
    shouldForwardProp: (prop) => prop !== "maxHeight",
})<{ maxHeight: number | null }>(({ theme, maxHeight }) => {
    return {
        maxHeight: maxHeight ? `${maxHeight}px` : "300px",
        overflowY: 'auto',
        marginTop: theme.spacing(1),
    }
});

const Key = styled('span')(({ theme }) => ({
    display: 'inline-block',
    padding: theme.spacing(0, 4),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.action.selected,
    fontWeight: 500,
    textAlign: 'center',
}));

const KeybindingContainer = styled('span', {
    shouldForwardProp: (prop) => prop !== 'alone',
})<{ alone?: boolean }>(({ alone }) => ({
    display: 'flex',
    alignItems: 'center',
    marginLeft: alone ? '0px' : '16px', // Ustaw marginLeft na 16px, jeśli alone jest true
    gap: '2px',
    fontSize: '0.7em',
}));

// Helper function to highlight matching text
export const highlightText = (text: string, query: string, theme: Theme) => {
    if (!query || query.trim() === '') return text;

    // Funkcja pomocnicza do escapowania znaków specjalnych w wyrażeniu regularnym
    const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Rozdziel query na części oddzielone spacją i escapuj znaki specjalne
    const queryParts = query.split(' ').filter(Boolean).map(escapeRegExp);

    // Funkcja pomocnicza do sprawdzania, czy część tekstu pasuje do dowolnej części query
    const matchQuery = (part: string) => {
        return queryParts.some((q) => part.toLowerCase().includes(q.toLowerCase()));
    };

    // Rozdziel tekst na części, które pasują lub nie pasują do query
    const regex = new RegExp(`(${queryParts.join('|')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
        matchQuery(part) ? (
            <span key={index} style={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                {part}
            </span>
        ) : (
            part
        )
    );
};

export function renderKeybindings(keybindings: string[], alone: boolean = false) {
    return (
        <KeybindingContainer alone={alone}>
            {keybindings.map((keybinding, bindingIdx, bindingArray) => (
                <React.Fragment key={bindingIdx}>
                    {splitKeybinding(keybinding).map((key, idx, array) => (
                        <React.Fragment key={idx}>
                            <Key>{key}</Key>
                            {idx < array.length - 1 && <span>+</span>}
                        </React.Fragment>
                    ))}
                    {bindingIdx < bindingArray.length - 1 && <span>&nbsp;→&nbsp;</span>}
                </React.Fragment>
            ))}
        </KeybindingContainer>
    );
}

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
    const [selectedGroup, setSelectedGroup] = useState<ActionGroupDescriptor | null>(null); // Zmieniono na przechowywanie całej grupy
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listItemRef = useRef<HTMLLIElement>(null); // Referencja do elementu listy
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

    const handleOptionClick = (option: ActionGroupOptionDescription<any>) => {
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
    const [filteredCommands, setFilteredCommands] = useState<ActionDescriptor<any>[]>([]);

    useEffect(() => {
        let isMounted = true;
        const fetchCommands = async () => {
            if (!open || !manager) {
                if (isMounted) setFilteredCommands([]);
                return;
            }
            // Usuń prefix z searchQuery, jeśli istnieje
            const queryWithoutPrefix = searchText.startsWith(selectedGroup?.prefix || '')
                ? searchText.slice((selectedGroup?.prefix || '').length).trim()
                : searchText;

            const actions = await manager.getRegisteredActions(selectedGroup?.prefix, getContext?.(), queryWithoutPrefix);
            if (isMounted) setFilteredCommands(actions);
        };
        fetchCommands();
        return () => {
            isMounted = false;
        };
    }, [open, manager, searchText, selectedGroup, getContext]);

    useEffect(() => {
        if (!open) return; // Nie wykonuj operacji, jeśli okno jest zamknięte

        // Znajdź indeks akcji, która ma właściwość selected ustawioną na true
        const selectedActionIndex = filteredCommands.findIndex(
            (action) => typeof action.selected === 'function' ? (
                getContext ? action.selected(getContext()) : false
            ) : false
        );

        if (selectedActionIndex !== -1) {
            setSelectedIndex(selectedActionIndex); // Ustaw selectedIndex na indeks wybranej akcji
            scrollToItem(selectedActionIndex); // Przewiń do wybranej akcji
        } else if (filteredCommands.length > 0) {
            setSelectedIndex(0); // Jeśli żadna akcja nie jest wybrana, ustaw na pierwszy element
        } else {
            setSelectedIndex(null); // Jeśli brak akcji, usuń zaznaczenie
        }
    }, [open, filteredCommands]);

    const scrollToItem = (index: number) => {
        const listItem = document.querySelectorAll<HTMLLIElement>(
            selectedGroup ? '.command-list-item' : '.command-list-group-item'
        )[index];
        listItem?.scrollIntoView({ block: 'nearest' });
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            handleClose();
        }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            if (selectedGroup && selectedGroup.onCancel && getContext) {
                selectedGroup.onCancel(getContext());
            }
            handleClose();
        }

        const items = selectedGroup
            ? filteredCommands
            : manager.getRegisteredActionGroups();

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedIndex((prev) => {
                const nextIndex = prev === null || prev === items.length - 1 ? 0 : prev + 1;
                scrollToItem(nextIndex);
                return nextIndex;
            });
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedIndex((prev) => {
                const nextIndex = prev === null || prev === 0 ? items.length - 1 : prev - 1;
                scrollToItem(nextIndex);
                return nextIndex;
            });
        }

        if (event.key === 'PageDown') {
            event.preventDefault();
            setSelectedIndex((prev) => {
                const nextIndex = Math.min((prev ?? 0) + 5, items.length - 1);
                scrollToItem(nextIndex);
                return nextIndex;
            });
        }

        if (event.key === 'PageUp') {
            event.preventDefault();
            setSelectedIndex((prev) => {
                const nextIndex = Math.max((prev ?? items.length - 1) - 5, 0);
                scrollToItem(nextIndex);
                return nextIndex;
            });
        }

        if (event.key === 'Enter' && selectedIndex !== null) {
            event.preventDefault();
            if (selectedGroup) {
                handleCommandClick(filteredCommands[selectedIndex]);
            } else {
                const selectedGroupItem = manager.getRegisteredActionGroups()[selectedIndex];
                if (selectedGroupItem) {
                    setSearchText(selectedGroupItem.prefix || '');
                    setSelectedGroup(selectedGroupItem);
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
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            if (open) {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
    }, [open, handleClose]);

    const handleCommandClick = (action: ActionDescriptor<any>) => {
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
    const [groupedContextMenuActions, setGroupedContextMenuActions] = useState<{ groupId: string; actions: ActionDescriptor<any>[]; }[]>([]);

    useEffect(() => {
        let isMounted = true;
        const fetchContextMenuActions = async () => {
            if (!manager) {
                if (isMounted) setGroupedContextMenuActions([]);
                return;
            }

            const actionsWithGroup = (await manager.getRegisteredActions('>')).filter(action => action.contextMenuGroupId);

            const grouped = actionsWithGroup.reduce((acc, action) => {
                const groupId = action.contextMenuGroupId!;
                if (!acc[groupId]) {
                    acc[groupId] = [];
                }
                acc[groupId].push(action);
                return acc;
            }, {} as Record<string, ActionDescriptor<any>[]>);

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
                        return orderA - orderB || a.label.localeCompare(b.label); // Sortowanie po contextMenuOrder, a potem po label
                    }),
                }));

            if (isMounted) setGroupedContextMenuActions(sortedGroups);
        };
        fetchContextMenuActions();
        return () => { isMounted = false; };
    }, [manager]);

    useEffect(() => {
        if (listItemRef.current && inputRef.current) {
            const itemHeight = listItemRef.current.offsetHeight;
            setListMaxHeight(itemHeight * 6); // Ustaw maksymalną wysokość na 6 pozycji
        }
    }, [filteredCommands]); // Wywołaj ponownie, gdy zmienią się komendy

    // Ensure all hooks are called, even if the component is not open
    useEffect(() => {
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

    return (
        <>
            {open && (
                <CommandPaletteContainer
                    ref={containerRef}
                    style={{ top: position.top, left: position.left }}
                    elevation={4}
                >
                    <TextField
                        fullWidth
                        label={
                            selectedGroup
                                ? selectedGroup.label // Wyświetl label grupy akcji, jeśli jest wybrana
                                : ""
                        }
                        placeholder={selectedGroup ? "" : t("select-command-group-prefix", "Select command group prefix...")}
                        value={searchText}
                        onChange={(e) => setSearchText(prev => prev !== e.target.value ? e.target.value : prev)}
                        inputRef={inputRef}
                        slotProps={{
                            input: {
                                endAdornment: selectedGroup?.options?.length ? (
                                    <InputAdornment position="end">
                                        <ButtonGroup>
                                            {selectedGroup.options.map((option) => (
                                                <Tooltip
                                                    key={option.id}
                                                    title={
                                                        <>
                                                            {option.label}
                                                            {option.keybinding && (
                                                                renderKeybindings([option.keybinding], true)
                                                            )}
                                                        </>
                                                    }
                                                >
                                                    <span>
                                                        <ToolButton
                                                            onClick={() => handleOptionClick(option)}
                                                            selected={getContext && typeof option.selected === 'function' ? option.selected(getContext()) : false}
                                                            disabled={getContext && typeof option.disabled === 'function' ? option.disabled(getContext()) : false}
                                                        >
                                                            {resolveIcon(theme, option.icon)}
                                                        </ToolButton>
                                                    </span>
                                                </Tooltip>
                                            ))}
                                        </ButtonGroup>
                                    </InputAdornment>
                                ) : null,
                            },
                        }}
                    />
                    <CommandList
                        disablePadding
                        dense
                        maxHeight={listMaxHeight} // Ustaw dynamiczną maksymalną wysokość
                    >
                        {selectedGroup
                            ? filteredCommands.map((action, index) => (
                                <ListItem
                                    key={action.id}
                                    disablePadding
                                    dense
                                    ref={index === 0 ? listItemRef : null} // Przypisz referencję do pierwszego elementu
                                    className="command-list-item"
                                >
                                    <ListItemButton
                                        onClick={() => handleCommandClick(action)}
                                        selected={
                                            index === selectedIndex ||
                                            (typeof action.selected === 'function' ? (
                                                getContext ? action.selected(getContext()) : false
                                            ) : false)
                                        }
                                    >
                                        <ListItemIcon>{resolveIcon(theme, action.icon)}</ListItemIcon>
                                        <ListItemText
                                            primary={highlightText(
                                                action.label,
                                                searchText.startsWith(selectedGroup?.prefix || '') ? searchText.slice((selectedGroup?.prefix || '').length).trim() : searchText,
                                                theme
                                            )}
                                            {...(action.secondaryLabel
                                                ? {
                                                    secondary: highlightText(
                                                        action.secondaryLabel,
                                                        searchText.startsWith(selectedGroup?.prefix || '') ? searchText.slice((selectedGroup?.prefix || '').length).trim() : searchText,
                                                        theme
                                                    ),
                                                }
                                                : {})}
                                        />
                                        {action.keybindings && renderKeybindings(action.keybindings)}
                                    </ListItemButton>
                                </ListItem>
                            ))
                            : manager.getRegisteredActionGroups().map((group, index) => (
                                <ListItem
                                    key={group.prefix || index}
                                    disablePadding
                                    dense
                                    className="command-list-group-item"
                                >
                                    <ListItemButton
                                        onClick={() => {
                                            setSearchText(group.prefix || '');
                                            setSelectedGroup(group); // Ustaw całą grupę
                                        }}
                                        selected={index === selectedIndex}
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
                    ...actions.map(action => (
                        <MenuItem
                            key={action.id}
                            onClick={() => {
                                handleContextMenuClose();
                                handleCommandClick(action);
                            }}
                        >
                            <ListItemIcon>{resolveIcon(theme, action.icon)}</ListItemIcon>
                            <ListItemText>{action.label}</ListItemText>
                            {action.keybindings && renderKeybindings(action.keybindings)}
                        </MenuItem>
                    )),
                ])}
            </Menu>
        </>
    );
};

export default CommandPalette;