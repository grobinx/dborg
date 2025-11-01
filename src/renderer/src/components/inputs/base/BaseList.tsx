import { Theme } from "@emotion/react";
import { alpha, styled, SxProps } from "@mui/material";
import { listItemSizeProperties } from "@renderer/themes/layouts/default/consts";
import { ThemeColor, themeColors } from "@renderer/types/colors";
import { Size } from "@renderer/types/sizes";
import clsx from "@renderer/utils/clsx";
import { blendColors } from "@renderer/utils/colors";
import React, { useRef, useState } from "react";

interface BaseListProps<T = any> extends React.AriaAttributes {
    ref?: React.Ref<HTMLUListElement>;
    items: T[];
    selected: T[];
    focused?: T | null;

    isEqual: (a: T, b: T) => boolean;

    onItemClick?: (item: T, event: React.MouseEvent) => void;
    onItemDoubleClick?: (item: T, event: React.MouseEvent) => void;
    onItemContextMenu?: (item: T, event: React.MouseEvent) => void;

    // event handlers for the list
    onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
    onKeyUp?: (event: React.KeyboardEvent<HTMLElement>) => void;
    onFocus?: (event: React.FocusEvent<HTMLElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLElement>) => void;
    onWheel?: (event: React.WheelEvent<HTMLElement>) => void;
    onScroll?: (event: React.UIEvent<HTMLElement>) => void;

    // event handlers for list items
    onMouseEnter?: (event: React.MouseEvent<HTMLElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<HTMLElement>) => void;
    onMouseMove?: (event: React.MouseEvent<HTMLElement>) => void;
    onMouseDown?: (event: React.MouseEvent<HTMLElement>) => void;
    onMouseUp?: (event: React.MouseEvent<HTMLElement>) => void;

    size?: Size | 'default';
    color?: ThemeColor | 'default';
    disabled?: boolean;
    dense?: boolean;

    renderItem: (item: T, state: { selected: boolean; focused: boolean }) => React.ReactNode;

    componentName?: string;
    id?: string;
    className?: string;
    sx?: SxProps<Theme>;
    style?: React.CSSProperties;

    [key: `data-${string}`]: any;
}

// Fabryki styled komponentów zależne od componentName (na wzór BaseButton)
const createStyledBaseListItem = (componentName: string) => {
    return styled('li', { name: componentName, slot: 'item' })(({ theme }) => ({
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        transition: "all 0.2s ease-in-out",
        alignContent: 'center',
        alignItems: 'center',
        "&.size-small": { ...listItemSizeProperties.small, padding: 0 },
        "&.size-medium": { ...listItemSizeProperties.medium, padding: 0 },
        "&.size-large": { ...listItemSizeProperties.large, padding: 0 },
        '&.size-default': { padding: 0 },
        outline: '1px solid transparent',
        outlineOffset: -1,
        ...themeColors.reduce((acc, color) => {
            acc[`&.color-${color}`] = {
                color: theme.palette.text.primary,
                '&.selected': {
                    backgroundColor: alpha(theme.palette[color].main, 0.2),
                },
                "&.focused": {
                    outlineColor: theme.palette[color].main,
                },
                "&:hover": {
                    backgroundColor: alpha(theme.palette[color].main, 0.1),
                    '&.selected': {
                        backgroundColor: alpha(theme.palette[color].main, 0.3),
                    },
                },
            };
            return acc;
        }, {} as Record<string, any>),
        '&.color-default': {
            '&.selected': {
                backgroundColor: theme.palette.action.selected,
            },
            '&.focused': {
                outlineColor: theme.palette.action.focus,
            },
            '&:hover': {
                backgroundColor: theme.palette.action.hover,
                '&.selected': {
                    backgroundColor: blendColors(theme.palette.action.selected, theme.palette.action.hover),
                },
            },
        },
    }));
};

const createStyledBaseList = (componentName: string) => {
    return styled('ul', { name: componentName, slot: 'root' })(() => ({
        outline: 'none',
        listStyle: 'none',
        margin: 0,
        padding: 0,
        overflow: 'auto',
        width: '100%',
        height: '100%',
        flex: 1,
    }));
};

const createStyledBaseViewport = (componentName: string) => {
    return styled('div', { name: componentName, slot: 'viewport' })(() => ({
        willChange: 'transform',
    }));
};

export function BaseList<T = any>(props: BaseListProps<T>) {
    const {
        componentName = "BaseList",
        id,
        className,
        ref,
        size = "medium",
        color = "main",
        disabled,
        items,
        selected,
        focused,
        dense,

        isEqual,

        renderItem,

        onItemClick,
        onItemDoubleClick,
        onItemContextMenu,

        onKeyDown,
        onFocus,
        onBlur,
        onMouseEnter,
        onMouseLeave,
        onMouseMove,
        onMouseDown,
        onMouseUp,
        onWheel,
        onScroll,
        onKeyUp,

        sx,
        style,

        ...rest
    } = props;

    // Tworzenie styled komponentów zależnych od nazwy
    const StyledBaseList = React.useMemo(() => createStyledBaseList(componentName), [componentName]);
    const StyledBaseListItem = React.useMemo(() => createStyledBaseListItem(componentName), [componentName]);
    const StyledBaseViewport = React.useMemo(() => createStyledBaseViewport(componentName), [componentName]);

    const listRef = useRef<HTMLUListElement>(null);
    React.useImperativeHandle(ref, () => listRef.current as HTMLUListElement);

    const [listFocused, setListFocused] = useState<boolean>(false);

    const classes = clsx(
        disabled && 'disabled',
        size && `size-${size}`,
        color && `color-${color}`,
        dense && 'dense',
        className
    );

    const isSelected = (item: T) => Array.isArray(selected) && selected.some(v => isEqual(v, item));
    const isFocused = (item: T) => listFocused && focused != null && isEqual(focused, item);

    return (
        <StyledBaseList
            ref={listRef}
            id={id}
            role="listbox"
            className={clsx(
                `${componentName}-root`,
                listFocused && 'focused',
                classes
            )}
            tabIndex={disabled ? -1 : 0}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onFocus={(e) => {
                onFocus?.(e);
                setListFocused(true);
            }}
            onBlur={(e) => {
                onBlur?.(e);
                setListFocused(false);
            }}
            onWheel={onWheel}
            onScroll={onScroll}
            sx={sx}
            style={style}
            {...rest}
        >
            <StyledBaseViewport className={`${componentName}-viewport`}>
                {items.map((item, index) => {
                    const sel = isSelected(item);
                    const foc = isFocused(item);

                    return (
                        <StyledBaseListItem
                            key={index}
                            role="option"
                            aria-selected={sel}
                            className={clsx(
                                `${componentName}-item`,
                                sel && "selected",
                                foc && "focused",
                                classes
                            )}
                            onClick={(e) => !disabled && onItemClick?.(item, e)}
                            onDoubleClick={(e) => !disabled && onItemDoubleClick?.(item, e)}
                            onContextMenu={(e) => !disabled && onItemContextMenu?.(item, e)}
                            onMouseEnter={onMouseEnter}
                            onMouseLeave={onMouseLeave}
                            onMouseMove={onMouseMove}
                            onMouseDown={onMouseDown}
                            onMouseUp={onMouseUp}
                            tabIndex={-1}
                        >
                            {renderItem(item, { selected: sel, focused: foc })}
                        </StyledBaseListItem>
                    );
                })}
            </StyledBaseViewport>
        </StyledBaseList>
    );
}

BaseList.displayName = "BaseList";