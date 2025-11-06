import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { Size } from '@renderer/types/sizes';
import { FormattedContent, FormattedContentItem, FormattedText } from '../useful/FormattedText';
import { Adornment, BaseInputField } from './base/BaseInputField';
import { Box, ClickAwayListener, Divider, MenuItem, MenuList, Paper, Popper, styled, useTheme } from '@mui/material';
import { inputSizeProperties } from '@renderer/themes/layouts/default/consts';
import { DescribedList, AnyOption, isOption, Option } from './DescribedList';
import { useKeyboardNavigation } from '@renderer/hooks/useKeyboardNavigation';

interface SelectFieldProps<T = any> extends BaseInputProps {
    placeholder?: FormattedContentItem;
    value?: T | T[];
    renderValue?: (selected: T | T[]) => React.ReactNode;
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLElement>;
    options: AnyOption<T>[];
    listHeight?: number;
}

/**
 * 
 * @param props 
 * @returns 
 * 
 * @description
 * Use "data-ignore-toggle" attribute on elements inside input to prevent toggling the select when clicking them (e.g. buttons).
 */
export const NewSelectField = <T,>(props: SelectFieldProps<T>) => {
    const {
        value,
        renderValue,
        onChange,
        size,
        color,
        options,
        disabled,
        listHeight = 250,
        inputProps,
        ...other
    } = props;

    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const menuListRef = React.useRef<HTMLUListElement>(null);
    const inputRef = React.useRef<HTMLDivElement>(null);
    const theme = useTheme();
    const [placement, setPlacement] = React.useState<string | undefined>(undefined);
    const multiple = Array.isArray(value);

    const selectedValues = multiple ? value : value !== undefined && value !== null ? [value] : [];

    const placementModifier = React.useMemo(() => ({
        name: "updatePlacementState",
        enabled: true,
        phase: 'afterWrite' as const,
        fn({ state }: any) {
            setPlacement(state.placement);
        },
    }), []);

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event: Event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
            return;
        }
        setOpen(false);
    };

    const handleItemClick = React.useCallback((val: T) => {
        onChange?.(val);
        if (!multiple) {
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
            inputRef.current?.focus();
        }
        if (open) {
            setFocusedItem(selectedValues[0] || null);
        }
        wasOpen.current = open;
    }, [open]);

    const SelectValueRenderer = () => {
        if (renderValue && value !== undefined) return renderValue(value);

        if (!Array.isArray(value)) {
            const option = options.find(option => isOption(option) && option.value === value);
            if (option && isOption(option)) {
                return (
                    <FormattedText
                        text={option.label}
                    />
                );
            }
            return null;
        }
        return (
            options
                .filter(option => isOption(option) && value?.includes(option.value))
                .map(option => (
                    isOption(option) && (
                        <FormattedText
                            key={option.value}
                            text={option.label}
                        />
                    )
                ))
        );
    };

    return (
        <BaseInputField
            ref={anchorRef}
            value={value}
            type='select'
            size={size}
            color={color}
            onChange={onChange}
            disabled={disabled}
            input={(
                <div
                    ref={inputRef}
                    style={{ width: '100%', height: '100%', display: 'inherit', flexDirection: 'inherit', gap: 'inherit', outline: 'none' }}
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
                    <Popper
                        open={open}
                        anchorEl={anchorRef.current}
                        style={{
                            zIndex: 1300,
                            width: anchorRef.current ? `${anchorRef.current.offsetWidth}px` : "auto",
                        }}
                        modifiers={[placementModifier]}
                    >
                        <Paper sx={{ margin: 1 }}>
                            <ClickAwayListener onClickAway={handleClose} mouseEvent="onMouseDown">
                                <Box
                                    display={"flex"}
                                    flexDirection={"column"}
                                >
                                    <DescribedList
                                        ref={menuListRef}
                                        options={options}
                                        selected={selectedValues}
                                        focused={focusedItem}
                                        size={size}
                                        color={color}
                                        onItemClick={handleItemClick}
                                        style={{
                                            maxHeight: listHeight,
                                            width: anchorRef.current ? `${anchorRef.current.offsetWidth}px` : "auto"
                                        }}
                                        description={placement === 'bottom' ? 'footer' : 'header'}
                                        tabIndex={-1}
                                    />
                                    {/* Opis opcji jest już obsługiwany przez DescribedList */}
                                </Box>
                            </ClickAwayListener>
                        </Paper>
                    </Popper>
                </Adornment>
            }
            {...other}
        />
    );
};

NewSelectField.displayName = "SelectField";
