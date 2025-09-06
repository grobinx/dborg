import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContent, FormattedContentItem, FormattedText } from '../useful/FormattedText';
import { validateMaxLength, validateMinLength } from './base/useValidation';
import { Adornment, BaseInputField } from './base/BaseInputField';
import { Box, ClickAwayListener, Divider, MenuItem, MenuList, Paper, Popper, styled, useTheme } from '@mui/material';
import { ToolButton } from '../buttons/ToolButton';
import { useTranslation } from 'react-i18next';

export interface SelectOption {
    label: FormattedContentItem;
    value: string | number;
    description?: FormattedContent;
}

interface SelectFieldProps extends BaseInputProps {
    placeholder?: FormattedContentItem;
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    options?: SelectOption[];
}

const StyledMenuItem = styled(MenuItem)({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 32,
});

export const SelectField: React.FC<SelectFieldProps> = (props) => {
    const {
        value,
        onChange,
        size,
        color,
        options,
        ...other
    } = props;

    const decorator = useInputDecorator();
    const [open, setOpen] = React.useState(false);
    const [optionDescription, setOptionDescription] = React.useState<FormattedContent>(options?.find(option => option.value === value)?.description || null);
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const menuListRef = React.useRef<HTMLUListElement>(null);
    const [popperBelow, setPopperBelow] = React.useState(false);
    const { t } = useTranslation();
    const theme = useTheme();
    const [focusedIndex, setFocusedIndex] = React.useState(-1);

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
        const popperRect = document.querySelector('.MuiPaper-root')?.getBoundingClientRect();

        if (!popperRect) return false;

        // Sprawdź, czy górna krawędź Popper jest poniżej dolnej krawędzi Select
        return popperRect.top >= anchorRect.bottom;
    };

    React.useEffect(() => {
        if (open) {
            setPopperBelow(isPopperBelow());
        }
    }, [open]);

    React.useEffect(() => {
        setOptionDescription(options?.find(option => option.value === value)?.description || null);
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!options) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex(prev => {
                    const nextIndex = prev < options.length - 1 ? prev + 1 : 0;
                    return nextIndex;
                });
                break;

            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(prev => {
                    const prevIndex = prev > 0 ? prev - 1 : options.length - 1;
                    return prevIndex;
                });
                break;

            case 'Enter':
                e.preventDefault();
                if (focusedIndex >= 0 && options[focusedIndex]) {
                    onChange?.(options[focusedIndex].value);
                    setOpen(false);
                    setFocusedIndex(-1);
                }
                break;

            case 'Escape':
                e.preventDefault();
                setOpen(false);
                setFocusedIndex(-1);
                break;

            case 'Home':
                e.preventDefault();
                setFocusedIndex(0);
                break;

            case 'End':
                e.preventDefault();
                setFocusedIndex(options.length - 1);
                break;
        }
    };

    // Reset focused index when menu opens
    React.useEffect(() => {
        if (open) {
            const currentIndex = options?.findIndex(opt => opt.value === value) ?? -1;
            setFocusedIndex(currentIndex);
            setTimeout(() => {
                menuListRef.current?.focus();
            }, 0);
        } else {
            setFocusedIndex(-1);
        }
    }, [open, options, value]);

    return (
        <BaseInputField
            ref={anchorRef}
            value={value}
            type='select'
            size={size}
            color={color}
            onChange={onChange}
            input={
                <FormattedText
                    text={options?.find(option => option.value === value)?.label}
                />
            }
            inputProps={{
                onMouseDown: handleToggle,
                onKeyDown: (e) => {
                    if (e.key === ' ') {
                        handleToggle();
                    }
                },
            }}
            inputAdornments={
                <Adornment position='input'>
                    <ToolButton
                        onClick={handleToggle}
                        size={size}
                        color={color}
                        dense
                    >
                        {open ? <theme.icons.ExpandLess /> : <theme.icons.ExpandMore />}
                    </ToolButton>
                    <Popper
                        open={open}
                        anchorEl={anchorRef.current}
                        placement="bottom-start"
                        style={{
                            zIndex: 1300,
                            width: anchorRef.current ? `${anchorRef.current.offsetWidth}px` : "auto",
                        }}
                    >
                        <Paper elevation={3} sx={{ margin: 1 }}>
                            <ClickAwayListener onClickAway={handleClose} mouseEvent="onMouseDown">
                                <Box
                                    display={"flex"}
                                    flexDirection={"column"}
                                >
                                    <MenuList
                                        ref={menuListRef}
                                        sx={{
                                            maxHeight: 200,
                                            overflow: "auto",
                                            outline: "none",
                                        }}
                                        tabIndex={0}
                                        onKeyDown={handleKeyDown}
                                    >
                                        {options?.map((option, index) => (
                                            <StyledMenuItem
                                                key={option.value}
                                                value={option.value}
                                                onMouseDown={() => {
                                                    setOpen(false);
                                                    onChange?.(option.value);
                                                }}
                                                selected={value === option.value}
                                                onMouseEnter={() => {
                                                    setFocusedIndex(index);
                                                    setOptionDescription(option.description || null);
                                                }}
                                                onMouseLeave={() => {
                                                    setOptionDescription(options?.find(opt => opt.value === value)?.description || null);
                                                }}
                                            >
                                                <FormattedText text={option.label} />
                                            </StyledMenuItem>
                                        ))}
                                    </MenuList>
                                    {optionDescription && (<>
                                        <Divider sx={{ order: popperBelow ? 1 : -1 }} />
                                        <Box
                                            sx={{
                                                padding: 4,
                                                display: 'flex',
                                                width: '100%',
                                                order: popperBelow ? 2 : -2,
                                            }}
                                        >
                                            <FormattedText text={optionDescription} />
                                        </Box>
                                    </>)}
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
