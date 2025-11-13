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

    /** Whether the list should use virtual scrolling */
    virtual?: boolean;
    /** 
     * Height of each item in pixels, required for virtual scrolling.
     * If virtual not enabled, it will be used to set minHeight and maxHeight of items, items outside visible area won't be rendered by renderItem
     */
    itemHeight?: number; // px
    /** Number of extra items to render above and below the visible area for smoother scrolling */
    overscan?: number;   // ile dodatkowych elementów renderować nad/pod widokiem

    renderItem: (item: T, state: { selected: boolean; focused: boolean }) => React.ReactNode;
    renderEmpty?: () => React.ReactNode;
    getItemClassName?: (item: T, index: number) => string | string[] | undefined;
    getItemId?: (item: T, index: number) => string | undefined;

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
        virtual = false,
        itemHeight,
        overscan = 4,

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
    const [scrollTop, setScrollTop] = useState(0);

    const classes = clsx(
        disabled && 'disabled',
        size && `size-${size}`,
        color && `color-${color}`,
        dense && 'dense',
        className
    );

    const handleScroll = (e: React.UIEvent<HTMLUListElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
        onScroll?.(e);
    };

    let visibleItems = items;
    let start = 0, end = items.length;

    if (itemHeight && items.length > 0 && listRef.current) {
        const containerHeight = listRef.current.offsetHeight || 300;
        const total = items.length;
        start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
        end = Math.min(total, Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan);
        if (virtual) {
            visibleItems = items.slice(start, end);
        }
    }

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
            onScroll={(virtual || itemHeight) ? handleScroll : onScroll}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onMouseMove={onMouseMove}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            style={{
                ...style,
                position: virtual ? 'relative' : undefined,
                overflowY: virtual ? 'auto' : undefined,
                height: virtual ? '100%' : undefined,
            }}
            {...rest}
        >
            {items.length === 0 && renderEmpty ? renderEmpty() :
                (virtual && itemHeight) ? (
                    <div style={{ height: items.length * itemHeight, position: 'relative' }}>
                        {visibleItems.map((item, index) => {
                            const realIndex = start + index;
                            const selected = isSelected?.(item, realIndex);
                            const focused = isFocused?.(item, realIndex);
                            const id = getItemId?.(item, realIndex);

                            return (
                                <StyledBaseListItem
                                    id={id ? id : undefined}
                                    key={realIndex}
                                    role="listitem"
                                    aria-selected={selected}
                                    className={clsx(
                                        `${componentName}-item`,
                                        selected && "selected",
                                        focused && "focused",
                                        getItemClassName?.(item, realIndex),
                                        classes
                                    )}
                                    style={{
                                        position: 'absolute',
                                        top: (realIndex * itemHeight),
                                        left: 0,
                                        right: 0,
                                        height: itemHeight,
                                    }}
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
                        })}
                    </div>
                ) : (
                    items.map((item, index) => {
                        const selected = isSelected?.(item, index);
                        const focused = isFocused?.(item, index);
                        const id = getItemId?.(item, index);

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
                                    getItemClassName?.(item, index),
                                    classes
                                )}
                                style={itemHeight ? { minHeight: itemHeight, maxHeight: itemHeight } : undefined}
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
                                {(index >= start && index <= end) && renderItem(item, { selected: selected ?? false, focused: focused ?? false })}
                            </StyledBaseListItem>
                        );
                    })
                )
            }
        </StyledBaseList>
    );
}

BaseList.displayName = "BaseList";