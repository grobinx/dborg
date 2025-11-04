import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { Size } from '@renderer/types/sizes';
import { FormattedContent, FormattedContentItem, FormattedText } from '../useful/FormattedText';
import { Adornment, BaseInputField } from './base/BaseInputField';
import { Box, ClickAwayListener, Divider, MenuItem, MenuList, Paper, Popper, styled, useTheme } from '@mui/material';
import { inputSizeProperties } from '@renderer/themes/layouts/default/consts';
import { DescribedList, AnyOption, isOption } from './DescribedList';

interface SelectFieldProps<T = any> extends BaseInputProps {
    placeholder?: FormattedContentItem;
    value?: T;
    renderValue?: (selected: T) => React.ReactNode;
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLElement>;
    options: AnyOption[];
    listHeight?: number;
}

const StyledMenuItem = styled(MenuItem, {
    name: "SelectField",
    slot: "MenuItem",
    shouldForwardProp: (prop) => prop !== 'componentSize',
})<{ componentSize?: Size }>(
    ({ componentSize = 'medium' }) => {
        const sizeProps = inputSizeProperties[componentSize];
        return {
            display: 'flex',
            alignItems: 'center',
            gap: sizeProps.gap,
            fontSize: sizeProps.fontSize,
            padding: sizeProps.padding,
            minHeight: sizeProps.height,
            '&.Mui-dense': {
                ...sizeProps['&.dense'],
            }
        };
    }
);

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

    React.useEffect(() => {
        if (!open && inputRef.current) {
            inputRef.current?.focus();
        }
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

    // Zamień MenuList na DescribedList
    // Ustal wybrane wartości jako tablicę (DescribedList wymaga tablicy)
    const selectedValues = Array.isArray(value) ? value : value !== undefined && value !== null ? [value] : [];

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
                onKeyDown: (e) => {
                    if ([' ', 'Enter', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
                        e.preventDefault();
                        handleToggle();
                    }
                    inputProps?.onKeyDown?.(e);
                },
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
                                    <DescribedList<T>
                                        ref={menuListRef}
                                        options={options}
                                        selected={selectedValues}
                                        size={size}
                                        color={color}
                                        onItemClick={(val) => {
                                            onChange?.(val);
                                            setOpen(false);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') setOpen(false);
                                        }}
                                        style={{
                                            maxHeight: listHeight,
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
