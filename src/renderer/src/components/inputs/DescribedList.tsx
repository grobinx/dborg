import { Theme } from "@emotion/react";
import { styled, SxProps } from "@mui/material";
import Tooltip from "@renderer/components/Tooltip";
import { FormattedContent, FormattedContentItem, FormattedText } from "@renderer/components/useful/FormattedText";
import { ThemeColor } from "@renderer/types/colors";
import { Size } from "@renderer/types/sizes";
import clsx from "@renderer/utils/clsx";
import React, { useRef, useState } from "react";
import { BaseList } from "./base/BaseList";
import { useScrollIntoView } from "@renderer/hooks/useScrollIntoView";

interface BaseOption {
}

/**
 * Opcja dzielnika (separatora)
 */
export interface DividerOption extends BaseOption {
}

interface LabeledOption extends BaseOption {
    label: FormattedContentItem;
}

export interface Option<T = any> extends LabeledOption {
    value: T;
    description?: FormattedContent;
}

export interface HeaderOption extends LabeledOption {
}

// Unia typów dla wszystkich możliwych opcji
export type AnyOption<T = any> = Option<T> | HeaderOption | DividerOption;

export function isOption(option: AnyOption<any>): option is Option<any> {
    return typeof option === 'object' && 'label' in option && 'value' in option;
}

export function isHeaderOption(option: AnyOption<any>): option is HeaderOption {
    return typeof option === 'object' && 'label' in option && !('value' in option);
}

export function isDividerOption(option: AnyOption<any>): option is DividerOption {
    return typeof option === 'object' && !('label' in option) && !('value' in option);
}

export function stringsToOptions(strings: string[], indexed: false): Option<string>[];
export function stringsToOptions(strings: string[], indexed: true): Option<number>[];
export function stringsToOptions(strings: string[], indexed: boolean): Option<any>[] {
    return strings.map((s, index) => ({
        value: indexed ? index : s,
        label: s
    }));
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

interface DescribedListProps<T = any> {
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

    renderItem?: (option: AnyOption<T>, state: { selected: boolean; focused: boolean }) => React.ReactNode;

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
    tabIndex?: number;
}

const StyledDescribedListHeader = styled('div', { name: 'DescribedList', slot: 'header' })(() => ({}));
const StyledDescribedListOption = styled('div', { name: 'DescribedList', slot: 'option' })(({ }) => ({}));
const StyledDescribedListContainer = styled('div', { name: 'DescribedList', slot: 'container' })(({ }) => ({}));
const StyledDescribedListDescription = styled('div', { name: 'DescribedList', slot: 'description' })(({ }) => ({}));

export function DescribedList<T = any>(props: DescribedListProps<T>) {
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
        descriptionSidebarWidth = 'auto',

        onItemClick,
        onItemDoubleClick,
        onItemContextMenu,

        onKeyDown,
        onFocus,
        onBlur,

        renderItem,

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
        if (hoveredValue || hovered?.description) return hovered ?? null;

        const foc = valueToOption.get(focusedItem);
        if (foc?.description || foc) return foc ?? null;

        const firstSel = selected?.length ? valueToOption.get(selected[0] as T) : null;
        if (firstSel?.description) return firstSel;

        return null;
    };

    const describedOption = effectiveDescription === 'tooltip' || effectiveDescription === 'none'
        ? null
        : defaultGetDescribedOption();

    const isSelected = (value: T) => Array.isArray(selected) && selected.some(v => Object.is(v, value));
    const isFocused = (value: T) => focusedItem != null && Object.is(focusedItem, value);

    const renderHeader = React.useCallback((option: HeaderOption) => (
        <StyledDescribedListHeader
            className={clsx(
                "DescribedList-header",
                classes
            )}>
            {renderItem ? renderItem(option, { selected: false, focused: false }) : <FormattedText text={option.label} />}
        </StyledDescribedListHeader>
    ), [classes]);

    const renderOption = React.useCallback((option: Option<T>, { selected, focused }: { selected: boolean; focused: boolean }) => {
        const content = renderItem ? renderItem(option, { selected, focused }) : <FormattedText text={option.label} />;

        const wrapped = (effectiveDescription === 'tooltip' && option.description)
            ? (
                <Tooltip title={option.description} placement="right">
                    {React.isValidElement(content) ? content : <span>{content}</span>}
                </Tooltip>
            )
            : content;

        return (
            <StyledDescribedListOption
                id={CSS.escape(String(option.value))}
                className={clsx(
                    "DescribedList-option", 
                    classes, 
                    selected && "selected",
                    focused && "focused",
                )}
                aria-selected={selected}
                role="presentation"
            >
                {wrapped}
            </StyledDescribedListOption>
        );
    }, [classes, effectiveDescription, anyHasDescription, disabled, classes]);

    useScrollIntoView({ 
        containerRef: listRef, 
        targetId: focusedItem as string, 
        stickyHeader: '.DescribedList-header',
        scrollOptions: { behavior: 'auto' },
        dependencies: [open] 
    });

    return (
        <StyledDescribedListContainer
            className={clsx('DescribedList-container', effectiveDescription === 'sidebar' && 'sidebar', classes)}
        >
            {effectiveDescription === 'header' && describedOption?.description && (
                <StyledDescribedListDescription className={clsx("DescribedList-description", "header", classes)}>
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
                onItemMouseEnter={(item, _e) => !disabled && anyHasDescription && isOption(item) && setHoveredValue(item.value)}
                onItemMouseLeave={(item, _e) => !disabled && anyHasDescription && isOption(item) && setHoveredValue(prev => (Object.is(prev, item.value) ? null : prev))}
                renderItem={(option, state) => {
                    if (isOption(option)) {
                        return renderOption(option, state);
                    }
                    if (isHeaderOption(option)) {
                        return renderHeader(option);
                    }
                    return null;
                }}
                getItemClassName={(item) => isOption(item) ? 'option' : isHeaderOption(item) ? 'header' : 'divider'}
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
                <StyledDescribedListDescription className={clsx("DescribedList-description", "footer", classes)}>
                    {describedOption?.description
                        ? <FormattedText text={describedOption.description} />
                        : (descriptionBehavior === 'reserveSpace' ? <span /> : null)}
                </StyledDescribedListDescription>
            )}

            {effectiveDescription === 'sidebar' && describedOption?.description && (
                <StyledDescribedListDescription
                    className={clsx("DescribedList-description", "sidebar", classes)}
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
