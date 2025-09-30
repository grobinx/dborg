import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { Size } from '@renderer/types/sizes';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContent, FormattedContentItem, FormattedText } from '../useful/FormattedText';
import { Adornment, BaseInputField } from './base/BaseInputField';
import { Box, ClickAwayListener, Divider, MenuItem, MenuList, Paper, Popper, styled, useTheme } from '@mui/material';
import { rootSizeProperties } from '@renderer/themes/layouts/default/consts';

export interface SelectOption<T = any> {
    label: FormattedContentItem;
    value: T;
    description?: FormattedContent;
}

interface SelectFieldProps<T = any> extends BaseInputProps {
    placeholder?: FormattedContentItem;
    value?: T;
    renderValue?: (selected: T) => React.ReactNode;
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLElement>;
    options?: SelectOption[];
    children?: React.ReactNode;
    listHeight?: number;
}

const StyledMenuItem = styled(MenuItem, {
    name: "SelectField",
    slot: "MenuItem",
    shouldForwardProp: (prop) => prop !== 'componentSize',
})<{ componentSize?: Size }>(
    ({ componentSize = 'medium' }) => {
        const sizeProps = rootSizeProperties[componentSize];
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
export const SelectField = <T,>(props: SelectFieldProps<T>) => {
    const {
        value,
        renderValue,
        onChange,
        size,
        color,
        options,
        disabled,
        children,
        listHeight = 250,
        inputProps,
        ...other
    } = props;

    const decorator = useInputDecorator();
    const [open, setOpen] = React.useState(false);
    const [optionDescription, setOptionDescription] = React.useState<FormattedContent>(options?.find(option => option.value === value)?.description || null);
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const menuListRef = React.useRef<HTMLUListElement>(null);
    const [popperBelow, setPopperBelow] = React.useState(false);
    const theme = useTheme();

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event: Event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
            return;
        }
        setOpen(false);
    };

    const isPopperBelow = () => {
        if (!anchorRef.current) return false;

        const anchorRect = anchorRef.current.getBoundingClientRect();
        return anchorRect.top <= window.innerHeight - anchorRect.bottom;
    };

    const SelectValueRenderer = () => {
        if (renderValue && value !== undefined) return renderValue(value);

        if (options) {
            if (!Array.isArray(value)) {
                return (
                    <FormattedText
                        text={options?.find(option => option.value === value)?.label}
                    />
                );
            }
            return (
                options
                    .filter(option => value?.includes(option.value))
                    .map(option => (
                        <FormattedText
                            key={option.value}
                            text={option.label}
                        />
                    ))
            );
        }

        if (children) {
            return (
                React.Children.toArray(children)
                    .filter(child => {
                        if (React.isValidElement(child) && child.type === MenuItem) {
                            const childValue = (child.props as any).value;
                            return Array.isArray(value)
                                ? value.includes(childValue)
                                : value === childValue;
                        }
                        return false;
                    })
                    .map(child => {
                        if (React.isValidElement(child) && child.props && 'children' in (child as any).props) {
                            return (child.props as any).children;
                        }
                        return null;
                    })
            );
        }

        return <></>; // równoważne z "" w poprzedniej wersji
    };

    React.useEffect(() => {
        if (open) {
            setPopperBelow(isPopperBelow());
            setOptionDescription(options?.find(option => option.value === value)?.description || null);
            setTimeout(() => {
                menuListRef.current?.focus();
            }, 0);
        }
    }, [value, open]);

    return (
        <BaseInputField
            ref={anchorRef}
            value={value}
            type='select'
            size={size}
            color={color}
            onChange={onChange}
            disabled={disabled}
            input={<SelectValueRenderer />}
            inputProps={{
                ...inputProps,
                onClick: (e) => {
                    if ((e.target as HTMLElement).closest('[data-ignore-toggle]')) {
                        return;
                    }
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
                        placement={popperBelow ? "bottom-start" : "top-start"}
                        style={{
                            zIndex: 1300,
                            width: anchorRef.current ? `${anchorRef.current.offsetWidth}px` : "auto",
                        }}
                    >
                        <Paper sx={{ margin: 1 }}>
                            <ClickAwayListener onClickAway={handleClose} mouseEvent="onMouseDown">
                                <Box
                                    display={"flex"}
                                    flexDirection={"column"}
                                >
                                    <MenuList
                                        ref={menuListRef}
                                        sx={{
                                            maxHeight: listHeight,
                                            overflow: "auto",
                                            outline: "none",
                                        }}
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') {
                                                setOpen(false);
                                            }
                                        }}
                                    >
                                        {children ? React.Children.toArray(children).map(child => {
                                            if (React.isValidElement(child) && child.type === MenuItem && 'value' in (child.props as any)) {
                                                const sizeProps = rootSizeProperties[size || 'medium'];
                                                return React.cloneElement(child, {
                                                    onClick: () => {
                                                        if (!Array.isArray(value)) {
                                                            setOpen(false);
                                                        }
                                                        onChange?.((child.props as any).value);
                                                        //anchorRef.current?.focus();
                                                    },
                                                    selected: Array.isArray(value) ? value.includes((child.props as any).value) : value === (child.props as any).value,
                                                    sx: {
                                                        fontSize: sizeProps.fontSize,
                                                        padding: sizeProps.padding,
                                                        minHeight: sizeProps.height,
                                                        gap: sizeProps.gap,
                                                        ...((child.props as any).sx || {})
                                                    }
                                                } as React.ComponentProps<typeof MenuItem>);
                                            }
                                            return child;
                                        }) :
                                            options?.map((option) => (
                                                <StyledMenuItem
                                                    key={option.value}
                                                    value={option.value}
                                                    componentSize={size}
                                                    onClick={() => {
                                                        if (!Array.isArray(value)) {
                                                            setOpen(false);
                                                        }
                                                        onChange?.(option.value);
                                                        //anchorRef.current?.focus();
                                                    }}
                                                    selected={Array.isArray(value) ? value.includes(option.value) : value === option.value}
                                                    onMouseEnter={() => {
                                                        setOptionDescription(option.description || null);
                                                    }}
                                                    onMouseLeave={() => {
                                                        setOptionDescription(option.description || null);
                                                    }}
                                                    onFocusVisible={() => {
                                                        setOptionDescription(option.description || null);
                                                    }}
                                                >
                                                    <FormattedText text={option.label} />
                                                </StyledMenuItem>
                                            ))}
                                    </MenuList>
                                    {optionDescription && (
                                        <Divider sx={{ order: popperBelow ? 1 : -1 }} />
                                    )}
                                    {optionDescription && (
                                        <Box
                                            sx={{
                                                padding: rootSizeProperties[size || 'medium'].gap,
                                                display: 'flex',
                                                width: '100%',
                                                order: popperBelow ? 2 : -2,
                                                fontSize: rootSizeProperties[size || 'medium'].fontSize,
                                                color: 'text.secondary',
                                            }}
                                        >
                                            <FormattedText text={optionDescription} />
                                        </Box>
                                    )}
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

SelectField.displayName = "SelectField";
