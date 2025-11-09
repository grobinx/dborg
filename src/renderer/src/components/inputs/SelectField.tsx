import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { Size } from '@renderer/types/sizes';
import { FormattedContent, FormattedContentItem, FormattedText } from '../useful/FormattedText';
import { Adornment, BaseInputField } from './base/BaseInputField';
import { Box, ClickAwayListener, Divider, MenuItem, MenuList, Paper, Popper, styled, useTheme } from '@mui/material';
import { inputSizeProperties } from '@renderer/themes/layouts/default/consts';
import { DescribedList, AnyOption, isOption, Option } from './DescribedList';
import { useKeyboardNavigation } from '@renderer/hooks/useKeyboardNavigation';
import { Popover } from '../Popover';
import { useVisibleState } from '@renderer/hooks/useVisibleState';

interface SelectFieldProps<T = any> extends BaseInputProps {
    placeholder?: FormattedContentItem;
    value?: T | T[];
    renderValue?: (option: Option<T> | Option<T>[]) => React.ReactNode;
    renderItem?: (option: AnyOption<T>, state: { selected: boolean; focused: boolean }) => React.ReactNode;
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLElement>;
    options: AnyOption<T>[];
    listHeight?: number;
    // NOWE:
    multiValueDisplay?: "wrap" | "column" | "ellipsis";
}

/**
 * 
 * @param props 
 * @returns 
 * 
 * @description
 * Use "data-ignore-toggle" attribute on elements inside input to prevent toggling the select when clicking them (e.g. buttons).
 */
export const SelectField = <T,>(props: SelectFieldProps<T>) => {
    const {
        value,
        renderValue,
        renderItem,
        onChange,
        size,
        color,
        options,
        disabled,
        listHeight = 250,
        inputProps,
        // NOWE:
        multiValueDisplay = 'wrap',
        ...other
    } = props;

    const [open, setOpen] = React.useState(false);
    const [rootRef, visibleRoot] = useVisibleState<HTMLDivElement>();
    const listRef = React.useRef<HTMLUListElement>(null);
    const inputRef = React.useRef<HTMLDivElement>(null);
    const theme = useTheme();
    const [placement, setPlacement] = React.useState<string | undefined>(undefined);
    const multiple = Array.isArray(value);

    const selectedValues = multiple ? value : value !== undefined && value !== null ? [value] : [];

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (_event: Event) => {
        setOpen(false);
    };

    const handleItemClick = React.useCallback((val: T) => {
        onChange?.(val);
        if (!multiple) {
            if (inputRef.current) {
                inputRef.current?.focus();
            }
            setOpen(false);
        }
    }, [onChange]);

    const [focusedItem, setFocusedItem, listKeyDownHandler] = useKeyboardNavigation({
        items: options,
        getId: (item) => isOption(item) ? item.value : null,
        onEnter: (item) => isOption(item) && handleItemClick(item.value),
        actions: [
            { shortcut: 'Space', handler: (item) => isOption(item) && handleItemClick(item.value) }
        ]
    });

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLElement>) => {
        if (!open) {
            if ([' ', 'Enter', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
                e.preventDefault();
                handleToggle();
            }
        } else {
            if (e.key === 'Escape') {
                e.preventDefault();
                setOpen(false);
            }
            else {
                listKeyDownHandler(e);
            }
        }
        inputProps?.onKeyDown?.(e);
    }, [inputProps, open, listKeyDownHandler]);

    const wasOpen = React.useRef(false);
    React.useEffect(() => {
        if (wasOpen.current && !open && inputRef.current) {
            //inputRef.current?.focus();
        }
        if (open) {
            setFocusedItem(selectedValues[0] || null);
        }
        wasOpen.current = open;
    }, [open]);

    const SelectValueRenderer = () => {
        if (renderValue && value !== undefined) {
            if (Array.isArray(value)) {
                const items = options.filter(option => isOption(option) && value?.includes(option.value));
                return renderValue(items as Option<T>[]);
            }
            const option = options.find(option => isOption(option) && option.value === value);
            return option ? renderValue(option as Option<T>) : null;
        }

        if (!Array.isArray(value)) {
            const option = options.find(option => isOption(option) && option.value === value);
            if (option && isOption(option)) {
                return renderItem ? renderItem(option as AnyOption<T>, { selected: false, focused: false }) : <FormattedText text={option.label} />;
            }
            return null;
        }

        // WIELE WARTOŚCI BEZ renderValue:
        const selectedOptions = options.filter(option => isOption(option) && value?.includes(option.value)) as Option<T>[];

        if (multiValueDisplay === "column") {
            // Jedna kolumna
            return (
                <div style={{ overflow: "hidden" }}>
                    {selectedOptions.map((opt, idx) => (
                        renderItem ? renderItem(opt as AnyOption<T>, { selected: false, focused: false }) : <FormattedText key={idx} text={opt.label} />
                    ))}
                </div>
            );
        }

        if (multiValueDisplay === "ellipsis") {
            // Jeden wiersz z przecinkami i ucinaniem na końcu
            return (
                selectedOptions.map((opt, idx) => (
                    renderItem ? renderItem(opt as AnyOption<T>, { selected: false, focused: false }) : <FormattedText key={idx} text={opt.label} />
                ))
            );
        }

        // Domyślnie: wrap z przecinkami
        return (
            <span
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 4,
                    minWidth: 0,
                }}
            >
                {selectedOptions.map((opt, idx) => (
                    renderItem ? renderItem(opt as AnyOption<T>, { selected: false, focused: false }) : <FormattedText key={idx} text={opt.label} />
                ))}
            </span>
        );
    };

    return (
        <BaseInputField
            ref={rootRef}
            value={value}
            type='select'
            size={size}
            color={color}
            onChange={onChange}
            disabled={disabled}
            input={(
                <div
                    ref={inputRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'inherit',
                        flexDirection: 'inherit',
                        gap: 'inherit',
                        outline: 'none',
                        // kontrola zawijania/ucinania na kontenerze
                        whiteSpace: multiValueDisplay === 'ellipsis' ? 'nowrap' : 'normal',
                        overflow: multiValueDisplay === 'ellipsis' ? 'hidden' : undefined,
                        textOverflow: multiValueDisplay === 'ellipsis' ? 'ellipsis' : undefined,
                        flexWrap: multiValueDisplay === 'wrap' ? 'wrap' : 'nowrap',
                        minWidth: 0,
                    }}
                >
                    <SelectValueRenderer />
                </div>
            )}
            inputProps={{
                ...inputProps,
                onClick: (e) => {
                    handleToggle();
                    inputProps?.onClick?.(e);
                },
                onKeyDown: handleKeyDown,
            }}
            inputAdornments={
                <Adornment position='input'>
                    <span
                        onClick={handleToggle}
                        color={color}
                        style={{
                            cursor: 'pointer',
                        }}
                    >
                        {open ? <theme.icons.ExpandLess /> : <theme.icons.ExpandMore />}
                    </span>
                    <Popover
                        open={open && visibleRoot}
                        anchorEl={rootRef.current}
                        onClose={handleClose}
                        onChangePlacement={setPlacement}
                    >
                        <DescribedList
                            ref={listRef}
                            options={options}
                            selected={selectedValues}
                            focused={focusedItem}
                            size={size}
                            color={color}
                            onItemClick={handleItemClick}
                            style={{
                                maxHeight: listHeight,
                                width: (rootRef.current && (placement === 'bottom' || placement === 'top')) ? `${rootRef.current.offsetWidth}px` : "auto"
                            }}
                            description={placement === 'top' ? 'header' : 'footer'}
                            tabIndex={-1}
                            renderItem={renderItem}
                        />
                    </Popover>
                </Adornment>
            }
            {...other}
        />
    );
};

SelectField.displayName = "SelectField";
