import { Theme } from "@emotion/react";
import { styled, SxProps } from "@mui/material";
import { ThemeColor } from "@renderer/types/colors";
import { Size } from "@renderer/types/sizes";
import clsx from "@renderer/utils/clsx";
import React, { useRef, useState } from "react";

interface BaseListProps<T = any> extends React.AriaAttributes {
    ref?: React.Ref<HTMLUListElement>;
    items: T[];

    isSelected?: (item: T, index: number) => boolean;
    isFocused?: (item: T, index: number) => boolean;

    onItemClick?: (item: T, event: React.MouseEvent) => void;
    onItemDoubleClick?: (item: T, event: React.MouseEvent) => void;
    onItemContextMenu?: (item: T, event: React.MouseEvent) => void;
    onItemMouseEnter?: (item: T, event: React.MouseEvent) => void;
    onItemMouseLeave?: (item: T, event: React.MouseEvent) => void;
    onItemMouseMove?: (item: T, event: React.MouseEvent<HTMLElement>) => void;
    onItemMouseDown?: (item: T, event: React.MouseEvent<HTMLElement>) => void;
    onItemMouseUp?: (item: T, event: React.MouseEvent<HTMLElement>) => void;

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
    getItemId?: (item: T) => string | undefined;

    componentName?: string;
    id?: string;
    className?: string;
    sx?: SxProps<Theme>;
    style?: React.CSSProperties;
    tabIndex?: number;

    [key: `data-${string}`]: any;
}

// Fabryki styled komponentów zależne od componentName (na wzór BaseButton)
const createStyledBaseListItem = (componentName: string) => {
    return styled('li', { name: componentName, slot: 'item' })(({ }) => ({
    }));
};

const createStyledBaseList = (componentName: string) => {
    return styled('ul', { name: componentName, slot: 'root' })(({ }) => ({
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
        tabIndex,

        isSelected,
        isFocused,

        renderItem,
        renderEmpty,
        getItemClassName,
        getItemId,

        onItemClick,
        onItemDoubleClick,
        onItemContextMenu,
        onItemMouseEnter,
        onItemMouseLeave,
        onItemMouseMove,
        onItemMouseDown,
        onItemMouseUp,

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
            tabIndex={disabled ? -1 : (tabIndex ?? 0)}
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
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onMouseMove={onMouseMove}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            sx={sx}
            style={style}
            {...rest}
        >
            {items.length === 0 && renderEmpty ? renderEmpty() :
                items.map((item, index) => {
                    const selected = isSelected?.(item, index);
                    const focused = isFocused?.(item, index);
                    const id = getItemId?.(item);

                    return (
                        <StyledBaseListItem
                            id={id ? id : undefined}
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
                            onMouseEnter={(e) => !disabled && onItemMouseEnter?.(item, e)}
                            onMouseLeave={(e) => !disabled && onItemMouseLeave?.(item, e)}
                            onMouseMove={(e) => !disabled && onItemMouseMove?.(item, e)}
                            onMouseDown={(e) => !disabled && onItemMouseDown?.(item, e)}
                            onMouseUp={(e) => !disabled && onItemMouseUp?.(item, e)}
                            tabIndex={-1}
                        >
                            {renderItem(item, { selected: selected ?? false, focused: focused ?? false })}
                        </StyledBaseListItem>
                    );
                })
            }
        </StyledBaseList>
    );
}

BaseList.displayName = "BaseList";