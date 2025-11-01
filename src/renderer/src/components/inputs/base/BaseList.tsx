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

    isSelected?: (item: T) => boolean;
    isFocused?: (item: T) => boolean;

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
    renderEmpty?: () => React.ReactNode;
    getItemClassName?: (item: T) => string | string[] | undefined;
    getId?: (item: T) => string | undefined;

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
                "&:hover:not(.header)": {
                    backgroundColor: alpha(theme.palette[color].main, 0.1),
                    '&.selected': {
                        backgroundColor: alpha(theme.palette[color].main, 0.3),
                    },
                },
                "&.header": {
                    backgroundColor: theme.palette[color].main,
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
            '&:hover:not(.header)': {
                backgroundColor: theme.palette.action.hover,
                '&.selected': {
                    backgroundColor: blendColors(theme.palette.action.selected, theme.palette.action.hover),
                },
            },
            "&.header": {
                backgroundColor: theme.palette.background.paper,
            },
        },
        '&.header': {
            '.sticky &': {
                position: 'sticky',
                top: 0,
                zIndex: 1,
            }
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
        dense,

        isSelected,
        isFocused,

        renderItem,
        renderEmpty,
        getItemClassName,
        getId,

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
                {items.length === 0 && renderEmpty ? renderEmpty() :
                    items.map((item, index) => {
                        const selected = isSelected?.(item);
                        const focused = listFocused && isFocused?.(item);

                        return (
                            <StyledBaseListItem
                                id={getId?.(item)}
                                key={index}
                                role="listitem"
                                aria-selected={selected}
                                className={clsx(
                                    `${componentName}-item`,
                                    selected && "selected",
                                    focused && "focused",
                                    getItemClassName?.(item),
                                    classes
                                )}
                                onClick={(e) => !disabled && onItemClick?.(item, e)}
                                onDoubleClick={(e) => !disabled && onItemDoubleClick?.(item, e)}
                                onContextMenu={(e) => !disabled && onItemContextMenu?.(item, e)}
                                onMouseEnter={(e) => !disabled && onMouseEnter?.(e)}
                                onMouseLeave={(e) => !disabled && onMouseLeave?.(e)}
                                onMouseMove={(e) => !disabled && onMouseMove?.(e)}
                                onMouseDown={(e) => !disabled && onMouseDown?.(e)}
                                onMouseUp={(e) => !disabled && onMouseUp?.(e)}
                                tabIndex={-1}
                            >
                                {renderItem(item, { selected: selected ?? false, focused: focused ?? false })}
                            </StyledBaseListItem>
                        );
                    })
                }
            </StyledBaseViewport>
        </StyledBaseList>
    );
}

BaseList.displayName = "BaseList";