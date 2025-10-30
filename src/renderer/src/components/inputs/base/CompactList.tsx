import { Theme } from "@emotion/react";
import { alpha, styled, SxProps } from "@mui/material";
import Tooltip from "@renderer/components/Tooltip";
import { FormattedContent, FormattedContentItem, FormattedText } from "@renderer/components/useful/FormattedText";
import { listItemSizeProperties } from "@renderer/themes/layouts/default/consts";
import { ThemeColor, themeColors } from "@renderer/types/colors";
import { Size } from "@renderer/types/sizes";
import clsx from "@renderer/utils/clsx";
import React, { useRef, useState } from "react";

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
 * Pozycja opisu
 * - 'header' - opis powyżej listy
 * - 'footer' - opis poniżej listy
 * - 'sidebar' - opis po prawej/lewej stronie listy
 * - 'tooltip' - opis w tooltipie
 * - 'none' - brak opisu
 */
type DescriptionPosition = 'header' | 'footer' | 'sidebar' | 'tooltip' | 'none';

interface CompactListProps<T = any> {
    ref?: React.Ref<HTMLUListElement>;

    options: AnyOption<T>[];

    // Kontrolowany stan z zewnątrz
    selected: T[];           // zawsze tablica (single = 0-1 element)
    focused?: T | null;      // opcjonalnie zaznacz fokus wizualny

    // Zdarzenia (rodzic decyduje co zrobić)
    onItemClick?: (value: T, event: React.MouseEvent) => void;
    onItemDoubleClick?: (value: T, event: React.MouseEvent) => void;
    onItemContextMenu?: (value: T, event: React.MouseEvent) => void;

    onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLElement>) => void;

    // Wygląd
    size?: Size | 'default';
    color?: ThemeColor | 'default';
    disabled?: boolean;
    headerSticky?: boolean;
    dense?: boolean;

    // Opis
    description?: DescriptionPosition;
    noOptionsText?: FormattedContentItem;

    // Niestandardowa kontrola opisu (opcjonalne)
    getDescribedOption?: (ctx: {
        options: AnyOption<T>[];
        hovered: T | null;
        focused: T | null;
        selected: T[];
    }) => Option<T> | null;
    renderDescription?: (option: Option<T>) => React.ReactNode;
    descriptionBehavior?: 'autoHide' | 'reserveSpace';
    descriptionSidebarWidth?: number | string;

    // Render elementu
    renderOption?: (option: Option<T>, state: {
        selected: boolean;
        focused: boolean;
        hovered: boolean;
    }) => React.ReactNode;
    renderHeader?: (option: HeaderOption) => React.ReactNode;

    // A11y + kontenery
    'aria-label'?: string;
    'aria-labelledby'?: string;
    id?: string;
    className?: string;
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
    '&.size-default': { padding: '2px 4px' },
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
    '&.size-default': { padding: '2px 4px' },
    '&.footer': {
        borderTop: `1px solid ${theme.palette.divider}`,
    },
    '&.header': {
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
}));

export function CompactList<T = any>(props: CompactListProps<T>) {
    const {
        id,
        className,
        ref,
        size = "medium",
        color = "main",
        disabled,
        options,
        selected,
        focused: focusedItem,
        description = 'none',
        noOptionsText,
        headerSticky = true,
        dense,

        getDescribedOption,
        renderDescription,
        descriptionBehavior = 'autoHide',
        descriptionSidebarWidth = '35%',

        renderOption,
        renderHeader,

        onItemClick,
        onItemDoubleClick,
        onItemContextMenu,

        onKeyDown,
        onFocus,
        onBlur,

        sx,
        style,
    } = props;

    const listRef = useRef<HTMLUListElement>(null);
    React.useImperativeHandle(ref, () => listRef.current as HTMLUListElement);

    const [hoveredValue, setHoveredValue] = useState<T | null>(null);
    const [listFocused, setListFocused] = useState<boolean>(false);

    const classes = clsx(
        disabled && 'disabled',
        size && `size-${size}`,
        color && `color-${color}`,
        dense && 'dense',
        className
    );

    const valueToOption = React.useMemo(() => {
        const map = new Map<any, Option<T>>();
        for (const o of options) if (isOption(o)) map.set((o as Option<T>).value, o as Option<T>);
        return map;
    }, [options]);

    const anyHasDescription = React.useMemo(() => options.some(o => isOption(o) && (o as Option<T>).description), [options]);
    const effectiveDescription: DescriptionPosition = anyHasDescription ? description : 'none';

    const defaultGetDescribedOption = (): Option<T> | null => {
        const hovered = valueToOption.get(hoveredValue);
        if (hovered?.description) return hovered;

        const foc = valueToOption.get(focusedItem ?? null);
        if (foc?.description) return foc;

        const firstSel = selected?.length ? valueToOption.get(selected[0] as T) : null;
        if (firstSel?.description) return firstSel;

        return null;
    };

    const describedOption = effectiveDescription === 'tooltip' || effectiveDescription === 'none'
        ? null
        : (getDescribedOption
            ? getDescribedOption({ options, hovered: hoveredValue, focused: focusedItem ?? null, selected: selected ?? [] })
            : defaultGetDescribedOption());

    const isSelected = (value: T) => Array.isArray(selected) && selected.some(v => Object.is(v, value));
    const isFocused = (value: T) => listFocused && focusedItem != null && Object.is(focusedItem, value);
    const isHovered = (value: T) => hoveredValue != null && Object.is(hoveredValue, value);

    const renderItemHeader = (option: HeaderOption) => (
        <StyledCompactListHeader className={clsx("CompactList-header", classes)}>
            {renderHeader ? renderHeader(option) : <FormattedText text={option.label} />}
        </StyledCompactListHeader>
    );

    const renderItemOption = (option: Option<T>) => {
        const sel = isSelected(option.value);
        const foc = isFocused(option.value);
        const hov = isHovered(option.value);

        const content = renderOption
            ? renderOption(option, { selected: sel, focused: foc, hovered: hov })
            : <FormattedText text={option.label} />;

        const wrapped = (effectiveDescription === 'tooltip' && option.description)
            ? (
                <Tooltip title={option.description} placement="right">
                    <span>{React.isValidElement(content) ? content : <span>{content}</span>}</span>
                </Tooltip>
            )
            : content;

        return (
            <StyledCompactListOption
                id={CSS.escape(String(option.value))}
                className={clsx("CompactList-option", classes, sel && "selected")}
                aria-selected={sel}
                role="presentation"
            >
                {wrapped}
            </StyledCompactListOption>
        );
    };

    return (
        <StyledCompactContainer
            className={clsx('CompactList-container', effectiveDescription === 'sidebar' && 'sidebar', classes)}
        >
            {effectiveDescription === 'header' && describedOption?.description && (
                <StyledDescriptionArea className={clsx("CompactList-description", "header", classes)}>
                    {describedOption?.description
                        ? (renderDescription ? renderDescription(describedOption) : <FormattedText text={describedOption.description} />)
                        : (descriptionBehavior === 'reserveSpace' ? <span /> : null)}
                </StyledDescriptionArea>
            )}

            <StyledCompactList
                ref={listRef}
                id={id}
                role="listbox"
                aria-multiselectable
                className={clsx('CompactList-root', classes)}
                tabIndex={disabled ? -1 : 0}
                onKeyDown={onKeyDown}
                onFocus={(e) => {
                    onFocus?.(e);
                    setListFocused(true);
                }}
                onBlur={(e) => {
                    onBlur?.(e);
                    setListFocused(false);
                }}
                sx={sx}
                style={style}
            >
                <StyledCompactViewport className="CompactList-viewport">
                    {options.length === 0 && noOptionsText && (
                        <StyledCompactListItem className={clsx("CompactList-item", classes)} tabIndex={-1}>
                            <FormattedText text={noOptionsText} />
                        </StyledCompactListItem>
                    )}

                    {options.map((option, index) => {
                        if (isHeaderOption(option)) {
                            return (
                                <StyledCompactListItem
                                    id={`header-${index}`}
                                    key={`h-${index}`}
                                    className={clsx(
                                        "CompactList-item",
                                        "header",
                                        headerSticky && "sticky",
                                        classes
                                    )}
                                    tabIndex={-1}
                                >
                                    {renderItemHeader(option)}
                                </StyledCompactListItem>
                            );
                        }

                        const opt = option as Option<T>;
                        const sel = isSelected(opt.value);
                        const foc = isFocused(opt.value);

                        return (
                            <StyledCompactListItem
                                id={CSS.escape(String(opt.value))}
                                key={`o-${index}`}
                                role="option"
                                aria-selected={sel}
                                className={clsx(
                                    "CompactList-item",
                                    sel && "selected",
                                    foc && "focused",
                                    classes
                                )}
                                onClick={(e) => !disabled && onItemClick?.(opt.value, e)}
                                onDoubleClick={(e) => !disabled && onItemDoubleClick?.(opt.value, e)}
                                onContextMenu={(e) => !disabled && onItemContextMenu?.(opt.value, e)}
                                onMouseEnter={() => !disabled && anyHasDescription && setHoveredValue(opt.value)}
                                onMouseLeave={() => !disabled && anyHasDescription && setHoveredValue(prev => (Object.is(prev, opt.value) ? null : prev))}
                                tabIndex={-1}
                            >
                                {renderItemOption(opt)}
                            </StyledCompactListItem>
                        );
                    })}
                </StyledCompactViewport>
            </StyledCompactList>

            {effectiveDescription === 'footer' && describedOption?.description && (
                <StyledDescriptionArea className={clsx("CompactList-description", "footer", classes)}>
                    {describedOption?.description
                        ? (renderDescription ? renderDescription(describedOption) : <FormattedText text={describedOption.description} />)
                        : (descriptionBehavior === 'reserveSpace' ? <span /> : null)}
                </StyledDescriptionArea>
            )}

            {effectiveDescription === 'sidebar' && describedOption?.description && (
                <StyledDescriptionArea
                    className={clsx("CompactList-description", "sidebar", classes)}
                    style={{ width: descriptionSidebarWidth, minWidth: 200, alignSelf: 'flex-start' }}
                >
                    {describedOption?.description
                        ? (renderDescription ? renderDescription(describedOption) : <FormattedText text={describedOption.description} />)
                        : (descriptionBehavior === 'reserveSpace' ? <span /> : null)}
                </StyledDescriptionArea>
            )}
        </StyledCompactContainer>
    );
}
