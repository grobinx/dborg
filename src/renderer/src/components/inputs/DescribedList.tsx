import { Theme } from "@emotion/react";
import { alpha, styled, SxProps } from "@mui/material";
import Tooltip from "@renderer/components/Tooltip";
import { FormattedContent, FormattedContentItem, FormattedText } from "@renderer/components/useful/FormattedText";
import { listItemSizeProperties } from "@renderer/themes/layouts/default/consts";
import { ThemeColor, themeColors } from "@renderer/types/colors";
import { Size } from "@renderer/types/sizes";
import clsx from "@renderer/utils/clsx";
import React, { useRef, useState } from "react";
import { BaseList } from "./base/BaseList";

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

    descriptionBehavior?: 'autoHide' | 'reserveSpace';
    descriptionSidebarWidth?: number | string;

    id?: string;
    className?: string;
    sx?: SxProps<Theme>;
    style?: React.CSSProperties;
}

const StyledDescribedListHeader = styled('div', { name: 'DescribedList', slot: 'header' })(() => ({
    display: 'flex',
    flexDirection: 'row',
    fontWeight: 'bold',
    '&.size-small': { padding: listItemSizeProperties.small.padding },
    '&.size-medium': { padding: listItemSizeProperties.medium.padding },
    '&.size-large': { padding: listItemSizeProperties.large.padding },
    '&.size-default': { padding: '2px 4px' },
}));
const StyledDescribedListOption = styled('div', { name: 'DescribedList', slot: 'option' })(({ }) => ({
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    width: '100%',
    '&.size-small': { padding: listItemSizeProperties.small.padding },
    '&.size-medium': { padding: listItemSizeProperties.medium.padding },
    '&.size-large': { padding: listItemSizeProperties.large.padding },
    '&.size-default': { padding: '2px 4px' },
}));
const StyledDescribedListContainer = styled('div', { name: 'DescribedList', slot: 'container' })(({ theme }) => ({
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
const StyledDescribedListDescription = styled('div', { name: 'DescribedList', slot: 'description' })(({ theme }) => ({
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

export function DescribedList<T = any>(props: CompactListProps<T>) {
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

        descriptionBehavior = 'autoHide',
        descriptionSidebarWidth = '35%',

        onItemClick,
        onItemDoubleClick,
        onItemContextMenu,

        onKeyDown,
        onFocus,
        onBlur,

        ...rest
    } = props;

    const listRef = useRef<HTMLUListElement>(null);
    React.useImperativeHandle(ref, () => listRef.current as HTMLUListElement);

    const [hoveredValue, setHoveredValue] = useState<T | null>(null);

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
        : defaultGetDescribedOption();

    const isSelected = (value: T) => Array.isArray(selected) && selected.some(v => Object.is(v, value));
    const isFocused = (value: T) => focusedItem != null && Object.is(focusedItem, value);

    const renderHeader = (option: HeaderOption) => (
        <StyledDescribedListHeader
            className={clsx(
                "DescribedList-header",
                classes
            )}>
            <FormattedText text={option.label} />
        </StyledDescribedListHeader>
    );

    const renderOption = (option: Option<T>, { selected, focused }: { selected: boolean; focused: boolean }) => {
        const content = <FormattedText text={option.label} />;

        const wrapped = (effectiveDescription === 'tooltip' && option.description)
            ? (
                <Tooltip title={option.description} placement="right">
                    <span>{React.isValidElement(content) ? content : <span>{content}</span>}</span>
                </Tooltip>
            )
            : content;

        return (
            <StyledDescribedListOption
                id={CSS.escape(String(option.value))}
                className={clsx(
                    "CompactList-option", 
                    classes, 
                    selected && "selected",
                    focused && "focused",
                )}
                aria-selected={selected}
                role="presentation"
                onMouseEnter={() => !disabled && anyHasDescription && setHoveredValue(option.value)}
                onMouseLeave={() => !disabled && anyHasDescription && setHoveredValue(prev => (Object.is(prev, option.value) ? null : prev))}
            >
                {wrapped}
            </StyledDescribedListOption>
        );
    };

    return (
        <StyledDescribedListContainer
            className={clsx('CompactList-container', effectiveDescription === 'sidebar' && 'sidebar', classes)}
        >
            {effectiveDescription === 'header' && describedOption?.description && (
                <StyledDescribedListDescription className={clsx("CompactList-description", "header", classes)}>
                    {describedOption?.description
                        ? <FormattedText text={describedOption.description} />
                        : (descriptionBehavior === 'reserveSpace' ? <span /> : null)}
                </StyledDescribedListDescription>
            )}

            <BaseList<AnyOption<T>>
                componentName="DescribedList"
                className={clsx(
                    headerSticky && "sticky",
                )}
                ref={listRef}
                id={id}
                items={options}
                size={size}
                color={color}
                disabled={disabled}
                dense={dense}
                isSelected={(item) => isOption(item) && isSelected(item.value)}
                isFocused={(item) => isOption(item) && isFocused(item.value)}
                onItemClick={(item, e) => isOption(item) && onItemClick?.(item.value, e)}
                onItemDoubleClick={(item, e) => isOption(item) && onItemDoubleClick?.(item.value, e)}
                onItemContextMenu={(item, e) => isOption(item) && onItemContextMenu?.(item.value, e)}
                renderItem={(option, state) => {
                    return isHeaderOption(option)
                        ? renderHeader(option)
                        : renderOption(option, state);
                }}
                getItemClassName={(item) => isHeaderOption(item) ? 'header' : 'option'}
                getItemId={(item) => isOption(item) ? item.value : undefined}
                renderEmpty={() => noOptionsText ? (
                    <FormattedText text={noOptionsText} />
                ) : null}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
                onBlur={onBlur}
                {...rest}
            />

            {effectiveDescription === 'footer' && describedOption?.description && (
                <StyledDescribedListDescription className={clsx("CompactList-description", "footer", classes)}>
                    {describedOption?.description
                        ? <FormattedText text={describedOption.description} />
                        : (descriptionBehavior === 'reserveSpace' ? <span /> : null)}
                </StyledDescribedListDescription>
            )}

            {effectiveDescription === 'sidebar' && describedOption?.description && (
                <StyledDescribedListDescription
                    className={clsx("CompactList-description", "sidebar", classes)}
                    style={{ width: descriptionSidebarWidth, minWidth: 200, alignSelf: 'flex-start' }}
                >
                    {describedOption?.description
                        ? <FormattedText text={describedOption.description} />
                        : (descriptionBehavior === 'reserveSpace' ? <span /> : null)}
                </StyledDescribedListDescription>
            )}
        </StyledDescribedListContainer>
    );
}
