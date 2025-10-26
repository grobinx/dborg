import { Theme } from "@emotion/react";
import { alpha, styled, SxProps } from "@mui/material";
import { FormattedContent, FormattedContentItem, FormattedText } from "@renderer/components/useful/FormattedText";
import { borderRadius, rootSizeProperties } from "@renderer/themes/layouts/default/consts";
import { ThemeColor, themeColors } from "@renderer/types/colors";
import { Size } from "@renderer/types/sizes";
import clsx from "@renderer/utils/clsx";
import React, { useRef, useLayoutEffect, useState } from "react";

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

interface CompactListProps<T = any> {
    id?: string;
    className?: string;
    ref?: React.Ref<HTMLUListElement>;
    size?: Size;
    color?: ThemeColor;
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
    "&.size-small": {
        ...rootSizeProperties.small,
    },

    "&.size-medium": {
        ...rootSizeProperties.medium
    },

    "&.size-large": {
        ...rootSizeProperties.large
    },
    '&.sticky': {
        position: 'sticky',
        top: 0,
    },
    '&.header': {
        cursor: 'default',
    },
    outline: '1px solid transparent',
    ...themeColors.reduce((acc, color) => {
        acc[`&.color-${color}`] = {
            backgroundColor: alpha(theme.palette[color].main, 0.1),
            color: theme.palette.text.primary,
            '&.header': {
                backgroundColor: theme.palette[color].main,
                color: theme.palette[color].contrastText,
            },

            '&.selected': {
                backgroundColor: alpha(theme.palette[color].main, 0.4),
                ".focused &": {
                    outlineColor: theme.palette[color].main,
                    //backgroundColor: alpha(palette[color].main, 0.5),
                },
            },

            "&:hover:not(.header)": {
                backgroundColor: alpha(theme.palette[color].main, 0.3),
            },
        };
        return acc;
    }, {}),
}));
const StyledCompactListHeader = styled('div', { name: 'CompactList', slot: 'header' })(() => ({
    display: 'flex',
    flexDirection: 'row',
    fontWeight: 'bold',
}));
const StyledCompactListOption = styled('div', { name: 'CompactList', slot: 'option' })(({ }) => ({
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    width: '100%',
}));
const StyledCompactList = styled('ul', { name: 'CompactList', slot: 'root' })(() => ({
    outline: 'none',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    overflow: 'auto',
}));
const StyledCompactViewport = styled('div', { name: 'CompactList', slot: 'viewport' })(() => ({
    willChange: 'transform',
}));

function getElementHeightPx(element: HTMLElement): number {
    const computed = window.getComputedStyle(element);
    const height = computed.height;
    // height jest stringiem, np. "40px" lub "2.5rem"
    if (height.endsWith('px')) {
        return parseFloat(height);
    }
    // Jeśli nie px, ustaw tymczasowo wysokość na elemencie i pobierz offsetHeight
    // (ale computed.height powinno już być w px dla większości przypadków)
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
        sx,
        style,
    } = props;

    // Stan niekontrolowany
    const [uncontrolledSelected, setUncontrolledSelected] = React.useState<T | T[] | null>(multiple ? [] : null);
    const [focused, setFocused] = React.useState(false);
    const [scrollTop, setScrollTop] = useState(0);

    const viewportRef = useRef<HTMLDivElement>(null);
    const [itemHeight, setItemHeight] = useState<number | null>(null);

    // Po zamontowaniu pobierz wysokość pierwszego elementu
    useLayoutEffect(() => {
        if (viewportRef.current) {
            const firstOption = viewportRef.current.querySelector("li:not(.header)");
            if (firstOption) {
                const px = getElementHeightPx(firstOption as HTMLElement);
                if (px > 0) setItemHeight(px);
            }
        }
    }, [lines, size, options, dense]);

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

    let effectiveLines = lines;
    if (
        effectiveLines === undefined &&
        maxHeight &&
        itemHeight
    ) {
        // Zamień na liczbę jeśli maxHeight jest stringiem (np. "400px")
        let maxHeightPx = typeof maxHeight === "number"
            ? maxHeight
            : parseFloat(maxHeight);
        effectiveLines = Math.max(1, Math.floor(maxHeightPx / itemHeight));
    }

    // Ustal źródło prawdy: kontrolowany czy niekontrolowany
    const currentSelected = selected !== undefined ? selected : uncontrolledSelected;

    const isSelected = (value: any): boolean => {
        if (multiple && Array.isArray(currentSelected)) {
            return currentSelected.includes(value);
        }
        return currentSelected === value;
    };

    // Obsługa kliknięcia na opcję
    const handleOptionClick = (option: Option<T>) => {
        if (disabled) return;

        let newSelected: T | T[] | null;

        if (multiple) {
            const arr = Array.isArray(currentSelected) ? [...currentSelected] : [];
            const idx = arr.indexOf(option.value);
            if (idx > -1) {
                arr.splice(idx, 1);
            } else {
                arr.push(option.value);
            }
            newSelected = arr;
        } else {
            newSelected = currentSelected === option.value ? null : option.value;
        }

        if (selected === undefined) {
            setUncontrolledSelected(newSelected);
        }
        onSelect?.(newSelected);
    };

    const handleScroll = (e: React.UIEvent<HTMLElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    const classes = clsx(
        disabled && 'disabled',
        size && `size-${size}`,
        color && `color-${color}`,
        dense && 'dense',
    );

    const renderHeader = (option: HeaderOption) => {
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

    const renderItem = (option: Option<T>) => {
        const opt = option as Option<T>;
        const selected = isSelected(opt.value);
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
                {renderOption ?
                    renderOption(opt, selected)
                    : <FormattedText text={opt.label} />
                }
            </StyledCompactListOption>
        );
    };

    const buffer = 10;
    const visibleCount = effectiveLines && itemHeight ? effectiveLines : 10;
    const totalCount = options.length;
    const rawStartIndex = itemHeight ? Math.floor(scrollTop / itemHeight) : 0;
    const startIndex = Math.max(0, rawStartIndex - buffer);
    const endIndex = Math.min(totalCount, rawStartIndex + visibleCount + buffer);

    const topPadding = itemHeight ? startIndex * itemHeight : 0;
    const bottomPadding = itemHeight ? (totalCount - endIndex) * itemHeight : 0;
    const visibleOptions = options.slice(startIndex, endIndex);

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

    const stickyHeader = headerSticky && !isHeaderOption(visibleOptions[0]) && headerMap.get(startIndex + buffer);

    return (
        <StyledCompactList
            ref={ref}
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
            sx={sx}
            style={{
                ...style,
                ...(maxHeight ? { maxHeight } : {}),
            }}
            onScroll={handleScroll}
        >
            <StyledCompactViewport
                className={clsx(
                    "CompactList-viewport"
                )}
                ref={viewportRef}
            >
                {headerSticky && stickyHeader && (
                    <StyledCompactListItem
                        key={'sticky-header'}
                        className={clsx(
                            "CompactList-item",
                            "sticky",
                            "header",
                            classes,
                        )}
                    >
                        {renderHeader(stickyHeader)}
                    </StyledCompactListItem>
                )}
                {options.length === 0 && noOptionsText && (
                    <StyledCompactListItem className={clsx("CompactList-item", classes)}>
                        <FormattedText text={noOptionsText} />
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
                            key={realIndex}
                            className={clsx(
                                "CompactList-item",
                                isHeader && headerSticky && "sticky",
                                isHeader && "header",
                                isHeader ? undefined : isSelected((option as Option<T>).value) ? "selected" : undefined,
                                classes,
                            )}
                            onClick={isHeader ? undefined : () => handleOptionClick(option as Option<T>)}
                        >
                            {isHeader ? renderHeader(option) : renderItem(option)}
                        </StyledCompactListItem>
                    );
                })}
                {options.length > 0 && bottomPadding > 0 && (
                    <li style={{ height: bottomPadding }} />
                )}
            </StyledCompactViewport>
        </StyledCompactList>
    );
}
