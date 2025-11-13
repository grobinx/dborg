import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { FormattedContentItem, FormattedText } from '../useful/FormattedText';
import { Adornment, BaseInputField } from './base/BaseInputField';
import { alpha, Box, Chip, styled, useTheme } from '@mui/material';
import { DescribedList, AnyOption, isOption, Option } from './DescribedList';
import { useKeyboardNavigation } from '@renderer/hooks/useKeyboardNavigation';
import { Popover } from '../Popover';
import { useVisibleState } from '@renderer/hooks/useVisibleState';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { useSearch } from '@renderer/hooks/useSearch';
import { TextField } from './TextField';
import { listItemSizeProperties } from '@renderer/themes/layouts/default/consts';
import { resolveColor } from '@renderer/utils/colors';
import { themeColors } from '@renderer/types/colors';
import clsx from '@renderer/utils/clsx';
import { InputDecorator } from './decorators/InputDecorator';

interface SelectFieldProps<T = any> extends BaseInputProps {
    placeholder?: FormattedContentItem;
    value?: T | T[];
    renderValue?: (option: Option<T> | Option<T>[]) => React.ReactNode;
    renderItem?: (option: AnyOption<T>, state: { selected: boolean; focused: boolean }) => React.ReactNode;
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLElement>;
    options: AnyOption<T>[];
    listHeight?: number;
    multiValueDisplay?: "wrap" | "column" | "ellipsis";
    maxItems?: number;
    searchable?: boolean;
    searchPlaceholder?: string;
}

const StyledSelectFieldListBox = styled('div', {
    name: "SelectField",
    slot: "listBox",
})(({ }) => ({
}));

const StyledSelectFieldSearch = styled('div', {
    name: "SelectField",
    slot: "search",
})(({ }) => ({
}));

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
        multiValueDisplay = 'wrap',
        maxItems,
        searchable = false,
        searchPlaceholder = 'Search...',
        ...other
    } = props;

    const [open, setOpen] = React.useState(false);
    const [rootRef, visibleRoot] = useVisibleState<HTMLDivElement>();
    const listRef = React.useRef<HTMLUListElement>(null);
    const inputRef = React.useRef<HTMLDivElement>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const theme = useTheme();
    const [placement, setPlacement] = React.useState<string | undefined>(undefined);
    const multiple = Array.isArray(value);
    const decorator = useInputDecorator();
    const [searchText, setSearchText] = React.useState('');

    const selectedValues = multiple ? value : value !== undefined && value !== null ? [value] : [];

    const [filteredOptions, highlightText] = useSearch(
        React.useMemo(() => options.filter(isOption), [options]),
        ['label', 'value', 'description'],
        searchText,
    );

    const displayOptions = React.useMemo(() => {
        if (!searchable || !searchText.trim()) {
            return options;
        }

        // Odtwórz strukturę z separatorami
        const filtered = new Set(filteredOptions?.map(f => f.value));
        return options.filter(opt => !isOption(opt) || filtered.has(opt.value));
    }, [searchable, searchText, options, filteredOptions]);

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (_event: Event) => {
        setOpen(false);
        setSearchText('');
    };

    const handleItemClick = React.useCallback((val: T) => {
        if (!multiple) {
            onChange?.(val);
            if (inputRef.current) {
                inputRef.current?.focus();
            }
            setOpen(false);
            setSearchText('');
        }
        else {
            if (value.length < (maxItems ?? Infinity) || value.includes(val)) {
                onChange?.(val);
            }
        }
    }, [onChange, multiple, value, maxItems]);

    React.useEffect(() => {
        if (decorator && maxItems && multiple) {
            Promise.resolve().then(() => {
                decorator.setRestrictions([`${(value ?? []).length}/${maxItems}`]);
            });
        }
    }, [multiple && value.length, decorator, maxItems]);

    const [focusedItem, setFocusedItem, listKeyDownHandler] = useKeyboardNavigation({
        items: displayOptions,
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
                if (searchable && searchText) {
                    setSearchText('');
                } else {
                    setOpen(false);
                }
            }
            else {
                listKeyDownHandler(e);
            }
        }
        inputProps?.onKeyDown?.(e);
    }, [inputProps, open, listKeyDownHandler, searchable, searchText]);

    const handleSearchKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            if (searchText) {
                setSearchText('');
            } else {
                setOpen(false);
            }
        } else if (['ArrowDown', 'ArrowUp', 'Enter', 'Space'].includes(e.key)) {
            listKeyDownHandler(e);
        }
    }, [searchText, listKeyDownHandler]);

    React.useEffect(() => {
        if (open) {
            setFocusedItem(selectedValues[0] || null);
            if (searchable) {
                // Focus search input when opening
                setTimeout(() => {
                    searchInputRef.current?.focus();
                }, 0);
            }
        }
    }, [open, searchable]);

    const RenderSelectedOption = ({ option }: { option: Option<T> }) => {
        return (
            <Chip
                style={{ fontSize: "inherit", height: "auto" }}
                size="small"
                onDelete={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleItemClick(option.value);
                }}
                onClick={(e) => {
                    e.stopPropagation();
                }}
                label={
                    renderItem ? renderItem(option as AnyOption<T>, { selected: false, focused: false }) : <FormattedText text={option.label} />
                }
            />
        );
    };

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

        const selectedOptions = options.filter(option => isOption(option) && value?.includes(option.value)) as Option<T>[];

        if (multiValueDisplay === "column") {
            return (
                <Box sx={{ overflow: "hidden" }}>
                    {selectedOptions.map((opt, idx) => (
                        <RenderSelectedOption key={idx} option={opt} />
                    ))}
                </Box>
            );
        }

        if (multiValueDisplay === "ellipsis") {
            return (
                selectedOptions.map((opt, idx) => (
                    <RenderSelectedOption key={idx} option={opt} />
                ))
            );
        }

        return (
            <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4, minWidth: 0, }}>
                {selectedOptions.map((opt, idx) => (
                    <RenderSelectedOption key={idx} option={opt} />
                ))}
            </span>
        );
    };

    let searchableField: React.ReactNode = null;
    if (searchable) {
        searchableField = (
            <StyledSelectFieldSearch
                className={clsx(
                    'SelectField-search',
                    `color-${color}`,
                    `size-${size || 'medium'}`,
                )}
            >
                <InputDecorator indicator={false} disableBlink>
                    <TextField
                        inputRef={searchInputRef}
                        size={size}
                        placeholder={searchPlaceholder}
                        value={searchText}
                        onChange={setSearchText}
                        onKeyDown={handleSearchKeyDown}
                        autoFocus
                    />
                </InputDecorator>
            </StyledSelectFieldSearch>
        );
    }


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
                <Box
                    ref={inputRef}
                    sx={{
                        width: '100%',
                        height: '100%',
                        display: 'inherit',
                        flexDirection: 'inherit',
                        gap: 'inherit',
                        outline: 'none',
                        whiteSpace: multiValueDisplay === 'ellipsis' ? 'nowrap' : 'normal',
                        overflow: multiValueDisplay === 'ellipsis' ? 'hidden' : undefined,
                        textOverflow: multiValueDisplay === 'ellipsis' ? 'ellipsis' : undefined,
                        flexWrap: multiValueDisplay === 'wrap' ? 'wrap' : 'nowrap',
                        minWidth: 0,
                    }}
                >
                    <SelectValueRenderer />
                </Box>
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
                        color={resolveColor(color, theme)}
                        style={{
                            cursor: 'pointer',
                        }}
                    >
                        {open ? <theme.icons.ExpandLess color={color} /> : <theme.icons.ExpandMore color={color} />}
                    </span>
                    <Popover
                        open={open && visibleRoot}
                        anchorEl={rootRef.current}
                        onClose={handleClose}
                        onChangePlacement={setPlacement}
                    >
                        <StyledSelectFieldListBox
                            className={clsx(
                                'SelectField-listBox',
                                `color-${color}`,
                                `size-${size || 'medium'}`,
                            )}
                        >
                            {placement !== 'top' && searchableField}
                            <DescribedList
                                ref={listRef}
                                options={displayOptions}
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
                                renderItem={searchable && searchText ?
                                    (option, state) => {
                                        if (!isOption(option)) return renderItem?.(option, state);
                                        const highlighted = highlightText(typeof option.label === 'string' ? option.label : '');
                                        return renderItem ? renderItem(option, state) : highlighted;
                                    } :
                                    renderItem
                                }
                            />
                            {placement === 'top' && searchableField}
                        </StyledSelectFieldListBox>
                    </Popover>
                </Adornment>
            }
            {...other}
        />
    );
};

SelectField.displayName = "SelectField";
