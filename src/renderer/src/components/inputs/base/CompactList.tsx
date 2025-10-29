import { Theme } from "@emotion/react";
import { alpha, styled, SxProps } from "@mui/material";
import Tooltip from "@renderer/components/Tooltip";
import { FormattedContent, FormattedContentItem, FormattedText } from "@renderer/components/useful/FormattedText";
import { useScrollIntoView, useScrollIntoViewCallback } from "@renderer/hooks/useScrollIntoView";
import { listItemSizeProperties } from "@renderer/themes/layouts/default/consts";
import { ThemeColor, themeColors } from "@renderer/types/colors";
import { Size } from "@renderer/types/sizes";
import clsx from "@renderer/utils/clsx";
import React, { useLayoutEffect, useRef, useState } from "react";

interface BaseOption {
    label: FormattedContentItem;
}

export interface Option<T = any> extends BaseOption {
    value: T;
    description?: FormattedContent;
}

export interface HeaderOption extends BaseOption {
}

// Unia typów dla wszystkich możliwych opcji
export type AnyOption<T = any> = Option<T> | HeaderOption;

function isOption(option: AnyOption<any>): option is Option<any> {
    return 'value' in option && option.value !== undefined;
}

function isHeaderOption(option: AnyOption<any>): option is HeaderOption {
    return !('value' in option) || option.value === undefined;
}

/**
 * Pozycja opisu w komponencie
 * Możliwe wartości:
 * - 'header' - opis powyżej listy
 * - 'footer' - opis poniżej listy
 * - 'sidebar' - opis po prawej stronie listy lub lewej jeśli się nie mieści
 * - 'tooltip' - opis po najechaniu myszką jako tooltip
 * - 'none' - brak opisu
 */
type DescriptionPosition =
    /** Opis powyżej listy */
    | 'header'
    /** Opis poniżej listy */
    | 'footer'
    /** Opis po prawej/lewej stronie listy */
    | 'sidebar'
    /** Opis po najechaniu myszką jako tooltip */
    | 'tooltip'
    /** Brak opisu */
    | 'none';

interface CompactListProps<T = any> {
    id?: string;
    className?: string;
    ref?: React.Ref<HTMLUListElement>;
    size?: Size;
    color?: ThemeColor | 'default';
    disabled?: boolean;
    noOptionsText?: FormattedContentItem;
    options: AnyOption<T>[];
    selected?: T | T[] | null;
    onSelect?: (value: T | T[] | null) => void;
    renderOption?: (option: Option<T>, selected: boolean) => React.ReactNode;
    multiple?: boolean;
    headerSticky?: boolean;
    /**
     * Liczba widocznych linii. Jeśli lista ma więcej opcji, pojawi się pasek przewijania.
     * Wymaga by w Theme dla elementu CompactList.item była ustawiona wysokość (height) dla rozmiarów (size).
     */
    lines?: number;
    dense?: boolean;
    description?: DescriptionPosition;
    sx?: SxProps<Theme>;
    style?: React.CSSProperties;
}

const StyledCompactListItem = styled('li', { name: 'CompactList', slot: 'item' })(({ theme }) => ({
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    transition: "all 0.2s ease-in-out",
    alignContent: 'center',
    alignItems: 'center',
    "&.size-small": { ...listItemSizeProperties.small, },
    "&.size-medium": { ...listItemSizeProperties.medium },
    "&.size-large": { ...listItemSizeProperties.large },
    '&.sticky': {
        position: 'sticky',
        top: 0,
    },
    '&.header': {
        cursor: 'default',
    },
    outline: '1px solid transparent',
    outlineOffset: -1,
    ...themeColors.reduce((acc, color) => {
        acc[`&.color-${color}`] = {
            color: theme.palette.text.primary,
            '&.header': {
                backgroundColor: theme.palette[color].main,
                color: theme.palette[color].contrastText,
            },

            '&.selected': {
                backgroundColor: alpha(theme.palette[color].main, 0.4),
            },

            "&.focused": {
                outlineColor: theme.palette[color].main,
                '&.multiple': {
                    outlineOffset: -2,
                    outlineWidth: 2,
                    '&:not(.selected)': {
                        backgroundColor: alpha(theme.palette[color].main, 0.2),
                    },
                },
            },

            "&:hover:not(.header)": {
                backgroundColor: alpha(theme.palette[color].main, 0.2),
                '&.selected': {
                    backgroundColor: alpha(theme.palette[color].main, 0.6),
                },
            },
        };
        return acc;
    }, {}),
    '&.color-default': {
        '&.header': {
            backgroundColor: theme.palette.background.header,
        },
        '&.selected': {
            backgroundColor: theme.palette.action.selected,
        },
        '&.focused': {
            outlineColor: theme.palette.action.focus,
            '&.multiple': {
                outlineOffset: -2,
                outlineWidth: 2,
                '&:not(.selected)': {
                    backgroundColor: theme.palette.action.hover,
                },
            },
        },
        '&:hover:not(.header)': {
            backgroundColor: theme.palette.action.hover,
        },
    },
}));
const StyledCompactListHeader = styled('div', { name: 'CompactList', slot: 'header' })(() => ({
    display: 'flex',
    flexDirection: 'row',
    fontWeight: 'bold',
}));
const StyledCompactListOption = styled('div', { name: 'CompactList', slot: 'option' })(({ }) => ({
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    width: '100%',
}));
const StyledCompactList = styled('ul', { name: 'CompactList', slot: 'root' })(() => ({
    outline: 'none',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    overflow: 'auto',
    width: '100%',
    height: '100%',
    flex: 1,
}));
const StyledCompactViewport = styled('div', { name: 'CompactList', slot: 'viewport' })(() => ({
    willChange: 'transform',
}));
const StyledCompactContainer = styled('div', { name: 'CompactList', slot: 'container' })(({ theme }) => ({
    display: 'flex',
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    userSelect: 'none',
    '&.sidebar': {
        flexDirection: 'row',
    },
    ...themeColors.reduce((acc, color) => {
        acc[`&.color-${color}`] = {
            backgroundColor: alpha(theme.palette[color].main, 0.1),
        };
        return acc;
    }, {}),
    '&.color-default': {
        backgroundColor: "transparent",
    },
}));
const StyledDescriptionArea = styled('div', { name: 'CompactList', slot: 'description' })(({ theme }) => ({
    display: 'flex',
    flex: '0 0 auto',
    "&.size-small": { fontSize: listItemSizeProperties.small.fontSize, padding: listItemSizeProperties.small.padding },
    "&.size-medium": { fontSize: listItemSizeProperties.medium.fontSize, padding: listItemSizeProperties.medium.padding },
    "&.size-large": { fontSize: listItemSizeProperties.large.fontSize, padding: listItemSizeProperties.large.padding },
    '&.footer': {
        borderTop: `1px solid ${theme.palette.divider}`,
    },
    '&.header': {
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
}));

function getElementHeightPx(element: HTMLElement): number {
    const computed = window.getComputedStyle(element);
    const height = computed.height;
    if (height.endsWith('px')) {
        return parseFloat(height);
    }
    return element.getBoundingClientRect().height;
}

export function CompactList<T = any>(props: CompactListProps<T>) {
    const {
        id,
        className,
        ref,
        size = "medium",
        color = "main",
        disabled,
        noOptionsText,
        options,
        selected,
        onSelect,
        renderOption,
        multiple,
        headerSticky,
        lines,
        dense,
        description = 'none',
        sx,
        style,
    } = props;

    // Stan niekontrolowany
    const [uncontrolledSelected, setUncontrolledSelected] = React.useState<T | T[] | null>(multiple ? [] : null);
    const [focusedItem, setFocusedItem] = React.useState<T | null>(null);
    const [focused, setFocused] = React.useState(false);
    const scrollTopRef = useRef(0); // Zmiana ze stanu na ref
    const [effectiveDescription, setEffectiveDescription] = useState<DescriptionPosition>(description);

    const viewportRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const [itemHeight, setItemHeight] = useState<number | null>(null);

    // New: track hovered item (real index in options)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    React.useImperativeHandle(ref, () => listRef.current as HTMLUListElement);

    React.useEffect(() => {
        if (!options.find(option => isOption(option) && option.description)) {
            setEffectiveDescription('none');
        } else {
            setEffectiveDescription(description ?? 'none');
        }
    }, [options, description]);

    // After mount measure base item height (no inline description adjustments)
    useLayoutEffect(() => {
        function measure() {
            if (viewportRef.current) {
                const firstOption = viewportRef.current.querySelector("li:not(.header)");
                if (firstOption) {
                    const px = getElementHeightPx(firstOption as HTMLElement);
                    if (px > 0) {
                        setItemHeight(px);
                    }
                }
            }
        }
        measure();
    }, [lines, size, options, dense]);

    const [maxHeight, setMaxHeight] = useState<number | string | undefined>(undefined);

    React.useEffect(() => {
        // Pobierz maxHeight z propsów style lub sx, jeśli istnieje
        const styleMaxHeight = style?.maxHeight;
        const sxMaxHeight =
            sx && typeof sx === 'object' && 'maxHeight' in sx
                ? (sx as any).maxHeight
                : undefined;

        // Wyznacz końcowy maxHeight: najpierw style, potem sx, potem lines
        const maxHeight =
            styleMaxHeight !== undefined
                ? styleMaxHeight
                : sxMaxHeight !== undefined
                    ? sxMaxHeight
                    : lines && itemHeight
                        ? lines * itemHeight
                        : undefined;

        setMaxHeight(maxHeight);
    }, [style, sx, lines, itemHeight]);

    const [effectiveLines, setEffectiveLines] = useState<number | undefined>(lines);

    React.useEffect(() => {
        let effectiveLines = lines;
        if (
            effectiveLines === undefined &&
            maxHeight &&
            itemHeight
        ) {
            let maxHeightPx = typeof maxHeight === "number"
                ? maxHeight
                : parseFloat(maxHeight);
            effectiveLines = Math.max(1, Math.floor(maxHeightPx / itemHeight));
        }
        setEffectiveLines(effectiveLines);
    }, [lines, maxHeight, itemHeight]);

    // Ustal źródło prawdy: kontrolowany czy niekontrolowany
    const currentSelected = selected !== undefined ? selected : uncontrolledSelected;

    const isSelected = (value: any): boolean => {
        if (multiple && Array.isArray(currentSelected)) {
            return currentSelected.includes(value);
        }
        return currentSelected === value;
    };

    const isFocusedItem = (value: any): boolean => {
        return focused && focusedItem === value;
    };

    const [activeDescriptionOption, setActiveDescriptionOption] = useState<Option<T> | null>(null);

    React.useEffect(() => {
        let option: Option<T> | null = null;

        // 1. Hovered
        if (hoveredIndex != null && isOption(options[hoveredIndex])) {
            option = options[hoveredIndex] as Option<T>;
        }

        // 2. Multiple: focusedItem z opisem
        if (!option && multiple && focusedItem != null) {
            option = options.find(o => isOption(o) && (o as Option<T>).value === focusedItem) as Option<T> | null;
        }

        // 3. Single select: selectedOption z opisem
        if (!option && !multiple && !Array.isArray(currentSelected) && currentSelected) {
            option = options.find(o => isOption(o) && (o as Option<T>).value === currentSelected) as Option<T> | null;
        }

        setActiveDescriptionOption(option ?? null);
    }, [hoveredIndex, focusedItem, currentSelected, multiple, options]);

    const toggleSelection = (value: T, ctrl: boolean, shift: boolean) => {
        let newSelected: T | T[] | null;
        if (multiple) {
            const arr = Array.isArray(currentSelected) ? [...currentSelected] : [];
            const idx = arr.indexOf(value);
            if (shift && focusedItem != null) {
                // Zaznacz zakres od focusedItem do klikniętego
                const optionIndexes = options
                    .map((opt, i) => isOption(opt) ? { value: opt.value, index: i } : null)
                    .filter(Boolean) as { value: T, index: number }[];
                const focusedIdx = optionIndexes.findIndex(o => o.value === focusedItem);
                const clickedIdx = optionIndexes.findIndex(o => o.value === value);
                if (focusedIdx !== -1 && clickedIdx !== -1) {
                    const [start, end] = [focusedIdx, clickedIdx].sort((a, b) => a - b);
                    const rangeValues = optionIndexes.slice(start, end + 1).map(o => o.value);
                    // Dodaj do już wybranych (bez duplikatów)
                    const merged = Array.from(new Set([...arr, ...rangeValues]));
                    newSelected = merged;
                } else {
                    newSelected = arr;
                }
            }
            else if (ctrl) {
                // Toggle pojedynczego elementu
                if (idx > -1) {
                    arr.splice(idx, 1);
                } else {
                    arr.push(value);
                }
                newSelected = arr;
            } else {
                // Bez Ctrl/Cmd/Shift - wybierz tylko kliknięty element
                newSelected = [value];
            }
        } else {
            newSelected = value;
        }
        if (selected === undefined) {
            setUncontrolledSelected(newSelected);
        }
        updateFocusedItem(value);
        onSelect?.(newSelected);
    }

    // Obsługa kliknięcia na opcję
    const handleOptionClick = (e: React.MouseEvent<HTMLElement>, option: Option<T>) => {
        if (disabled) return;

        toggleSelection(option.value, e.ctrlKey || e.metaKey, e.shiftKey);
    };

    const handleScroll = (e: React.UIEvent<HTMLElement>) => {
        scrollTopRef.current = e.currentTarget.scrollTop; // Użyj ref zamiast setState
    };

    const classes = clsx(
        disabled && 'disabled',
        size && `size-${size}`,
        color && `color-${color}`,
        dense && 'dense',
        multiple && 'multiple',
    );

    const renderItemHeader = (option: HeaderOption) => {
        return (
            <StyledCompactListHeader
                className={clsx(
                    "CompactList-header",
                    headerSticky && "sticky",
                    classes,
                )}
            >
                <FormattedText text={option.label} />
            </StyledCompactListHeader>
        );
    };

    const renderItemOption = (option: Option<T>) => {
        const opt = option as Option<T>;
        const selected = isSelected(opt.value);

        const baseContent = renderOption
            ? renderOption(opt, selected)
            : <FormattedText text={opt.label} />;

        // Tooltip wrapping (only if tooltip mode and description exists)
        const contentWithTooltip = (effectiveDescription === 'tooltip' && opt.description)
            ? (
                <Tooltip title={opt.description} placement="right">
                    <span>{React.isValidElement(baseContent) ? baseContent : <span>{baseContent}</span>}</span>
                </Tooltip>
            )
            : baseContent;

        return (
            <StyledCompactListOption
                id={CSS.escape(String(opt.value))}
                className={clsx(
                    "CompactList-option",
                    classes,
                    selected && "selected",
                )}
                aria-selected={selected}
            >
                {contentWithTooltip}
            </StyledCompactListOption>
        );
    };

    const headerMap = React.useMemo(() => {
        const map = new Map<number, HeaderOption>();
        let lastHeader: HeaderOption | null = null;
        for (let i = 0; i < options.length; i++) {
            const option = options[i];
            if (isHeaderOption(option)) {
                lastHeader = option;
            }
            if (lastHeader) {
                map.set(i, lastHeader);
            }
        }
        return map;
    }, [options]);

    const buffer = 10;
    const visibleCount = effectiveLines && itemHeight ? effectiveLines : 10;
    const totalCount = options.length;
    const rawStartIndex = itemHeight ? Math.floor(scrollTopRef.current / itemHeight) : 0; // Użyj ref
    const startIndex = Math.max(0, rawStartIndex - buffer);
    const endIndex = Math.min(totalCount, rawStartIndex + visibleCount + buffer);

    const visibleOptions = options.slice(startIndex, endIndex);
    const stickyHeaderOption =
        headerSticky &&
        !isHeaderOption(visibleOptions[0]) &&
        headerMap.get(startIndex + buffer);

    let topPadding = itemHeight ? startIndex * itemHeight : 0;
    let bottomPadding = itemHeight ? (totalCount - endIndex) * itemHeight : 0;

    // Uwzględnij sticky header w paddingach
    if (stickyHeaderOption && itemHeight) {
        if (topPadding >= itemHeight) {
            topPadding -= itemHeight;
        } else {
            const deficit = itemHeight - topPadding;
            topPadding = 0;
            bottomPadding = Math.max(0, bottomPadding - deficit);
        }
    }

    const getFirstOptionIndex = () => options.findIndex(isOption);
    const getLastOptionIndex = () => {
        for (let i = options.length - 1; i >= 0; i--) {
            if (isOption(options[i])) return i;
        }
        return -1;
    };
    const getNextOptionIndex = (current: number, dir: 1 | -1) => {
        let idx = current + dir;
        while (idx >= 0 && idx < options.length) {
            if (isOption(options[idx])) return idx;
            idx += dir;
        }
        return current;
    };

    const updateFocusedItem = (focusedItem: T | null) => {
        setFocusedItem(focusedItem);
        if (focusedItem == null || !listRef.current || !itemHeight) return;
        
        requestAnimationFrame(() => {
            const targetIndex = options.findIndex(
                opt => isOption(opt) && (opt as Option<T>).value === focusedItem
            );
            
            if (targetIndex === -1 || !listRef.current) return;
            
            const container = listRef.current;
            const targetScrollTop = targetIndex * itemHeight;
            const currentScrollTop = container.scrollTop;
            const viewportHeight = container.clientHeight;
            
            // Oblicz górną i dolną granicę widocznego obszaru
            const visibleTop = currentScrollTop;
            const visibleBottom = currentScrollTop + viewportHeight;
            
            // Oblicz pozycję elementu
            const itemTop = targetScrollTop;
            const itemBottom = targetScrollTop + itemHeight;
            
            // Uwzględnij sticky header jeśli istnieje
            let stickyHeaderHeight = 0;
            if (headerSticky) {
                const stickyHeader = container.querySelector('.CompactList-item.sticky.header');
                if (stickyHeader) {
                    stickyHeaderHeight = getElementHeightPx(stickyHeader as HTMLElement);
                }
            }
            
            // Sprawdź czy element jest poza widocznym obszarem
            const isAboveViewport = itemTop < (visibleTop + stickyHeaderHeight);
            const isBelowViewport = itemBottom > visibleBottom;
            
            if (isAboveViewport) {
                // Element powyżej widoku - przewiń tak by był na górze (pod sticky header)
                container.scrollTop = itemTop - stickyHeaderHeight;
            } else if (isBelowViewport) {
                // Element poniżej widoku - przewiń tak by był na dole
                container.scrollTop = itemBottom - viewportHeight;
            }
            // Jeśli element jest w widoku, nie rób nic
        });
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
        if (disabled) return;

        let currentIdx = focusedItem != null
            ? options.findIndex(opt => isOption(opt) && (opt as Option<T>).value === focusedItem)
            : -1;

        if (currentIdx === -1) {
            currentIdx = getFirstOptionIndex();
        }

        let nextIdx = currentIdx;

        if (e.key === "ArrowDown") {
            nextIdx = getNextOptionIndex(currentIdx, 1);
            const nextValue = isOption(options[nextIdx]) ? (options[nextIdx] as Option<T>).value : null;
            updateFocusedItem(nextValue);
            if (!multiple && nextValue !== null) {
                toggleSelection(nextValue, false, false);
            }
            e.preventDefault();
        } else if (e.key === "ArrowUp") {
            nextIdx = getNextOptionIndex(currentIdx, -1);
            const nextValue = isOption(options[nextIdx]) ? (options[nextIdx] as Option<T>).value : null;
            updateFocusedItem(nextValue);
            if (!multiple && nextValue !== null) {
                toggleSelection(nextValue, false, false);
            }
            e.preventDefault();
        } else if (e.key === "PageDown") {
            let steps = visibleCount || 10;
            let idx = currentIdx;
            for (let i = 0; i < steps; i++) {
                idx = getNextOptionIndex(idx, 1);
            }
            const nextValue = isOption(options[idx]) ? (options[idx] as Option<T>).value : null;
            console.log('PageDown to idx', idx, 'value', nextValue);
            updateFocusedItem(nextValue);
            if (!multiple && nextValue !== null) {
                toggleSelection(nextValue, false, false);
            }
            e.preventDefault();
        } else if (e.key === "PageUp") {
            let steps = visibleCount || 10;
            let idx = currentIdx;
            for (let i = 0; i < steps; i++) {
                idx = getNextOptionIndex(idx, -1);
            }
            const nextValue = isOption(options[idx]) ? (options[idx] as Option<T>).value : null;
            updateFocusedItem(nextValue);
            if (!multiple && nextValue !== null) {
                toggleSelection(nextValue, false, false);
            }
            e.preventDefault();
        } else if (e.key === "Home") {
            nextIdx = getFirstOptionIndex();
            const nextValue = isOption(options[nextIdx]) ? (options[nextIdx] as Option<T>).value : null;
            updateFocusedItem(nextValue);
            if (!multiple && nextValue !== null) {
                toggleSelection(nextValue, false, false);
            }
            e.preventDefault();
        } else if (e.key === "End") {
            nextIdx = getLastOptionIndex();
            const nextValue = isOption(options[nextIdx]) ? (options[nextIdx] as Option<T>).value : null;
            updateFocusedItem(nextValue);
            if (!multiple && nextValue !== null) {
                toggleSelection(nextValue, false, false);
            }
            e.preventDefault();
        } else if (e.key === " " || e.key === "Enter") {
            if (multiple && isOption(options[currentIdx])) {
                toggleSelection(
                    (options[currentIdx] as Option<T>).value,
                    e.ctrlKey || e.metaKey || e.key === " ",
                    e.shiftKey
                );
                if (e.key === " ") {
                    nextIdx = getNextOptionIndex(currentIdx, 1);
                    updateFocusedItem(isOption(options[nextIdx]) ? (options[nextIdx] as Option<T>).value : null);
                }
            }
            e.preventDefault();
        }
    };

    return (
        <StyledCompactContainer
            className={clsx(
                'CompactList-container',
                effectiveDescription === 'sidebar' && 'sidebar',
                classes
            )}
        >
            {effectiveDescription === 'header' && activeDescriptionOption?.description && (
                <StyledDescriptionArea className={clsx("CompactList-description", "header", classes)}>
                    <FormattedText text={activeDescriptionOption.description} />
                </StyledDescriptionArea>
            )}

            <StyledCompactList
                ref={listRef}
                id={id}
                className={clsx(
                    'CompactList-root',
                    classes,
                    focused && 'focused',
                    className
                )}
                tabIndex={disabled ? -1 : 0}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onKeyDown={handleKeyDown}
                sx={sx}
                style={style}
                onScroll={handleScroll}
            >
                <StyledCompactViewport
                    className={clsx(
                        "CompactList-viewport"
                    )}
                    ref={viewportRef}
                >
                    {options.length === 0 && noOptionsText && (
                        <StyledCompactListItem className={clsx("CompactList-item", classes)} tabIndex={-1}>
                            <FormattedText text={noOptionsText} />
                        </StyledCompactListItem>
                    )}
                    {stickyHeaderOption && (
                        <StyledCompactListItem
                            id={`header-sticky`}
                            key={'sticky-header'}
                            className={clsx(
                                "CompactList-item",
                                "sticky",
                                "header",
                                classes,
                            )}
                            tabIndex={-1}
                        >
                            {renderItemHeader(stickyHeaderOption)}
                        </StyledCompactListItem>
                    )}
                    {options.length > 0 && topPadding > 0 && (
                        <li style={{ height: topPadding }} />
                    )}
                    {options.length > 0 && visibleOptions.map((option, index) => {
                        const realIndex = startIndex + index;
                        const isHeader = isHeaderOption(option);
                        return (
                            <StyledCompactListItem
                                id={isHeader ? `header-${realIndex}` : CSS.escape(String((option as Option<T>).value))}
                                key={index}
                                className={clsx(
                                    "CompactList-item",
                                    isHeader && headerSticky && "sticky",
                                    isHeader && "header",
                                    !isHeader && isFocusedItem((option as Option<T>).value) && "focused",
                                    !isHeader && isSelected((option as Option<T>).value) && "selected",
                                    classes,
                                )}
                                onClick={isHeader ? undefined : (e) => handleOptionClick(e, option as Option<T>)}
                                onMouseEnter={isHeader ? undefined : () => setHoveredIndex(realIndex)}
                                onMouseLeave={isHeader ? undefined : () => setHoveredIndex(prev => (prev === realIndex ? null : prev))}
                                tabIndex={-1}
                            >
                                {isHeader ? renderItemHeader(option) : renderItemOption(option as Option<T>)}
                            </StyledCompactListItem>
                        );
                    })}
                    {options.length > 0 && bottomPadding > 0 && (
                        <li style={{ height: bottomPadding }} />
                    )}
                </StyledCompactViewport>
            </StyledCompactList>

            {effectiveDescription === 'footer' && activeDescriptionOption?.description && (
                <StyledDescriptionArea className={clsx("CompactList-description", "footer", classes)}>
                    <FormattedText text={activeDescriptionOption.description} />
                </StyledDescriptionArea>
            )}

            {effectiveDescription === 'sidebar' && activeDescriptionOption?.description && (
                <StyledDescriptionArea
                    className={clsx("CompactList-description", "sidebar", classes)}
                    style={{ width: '35%', minWidth: 200, alignSelf: 'flex-start' }}
                >
                    <FormattedText text={activeDescriptionOption.description} />
                </StyledDescriptionArea>
            )}
        </StyledCompactContainer>
    );
}
