import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { FormattedContentItem } from '../useful/FormattedText';
import { Adornment, BaseInputField } from './base/BaseInputField';
import Tooltip from '../Tooltip';
import { ToolButton } from '../buttons/ToolButton';
import ColorPicker, { ColorPickerType } from '../useful/ColorPicker';
import { styled, useTheme, Menu, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';
import clsx from '@renderer/utils/clsx';
import { htmlColors } from '@renderer/types/colors';
import ButtonGroup from '../buttons/ButtonGroup';

interface ColorFieldProps extends BaseInputProps {
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    picker?: ColorPickerType;
}

const StyledInputFieldColorIndicator = styled('div', {
    name: "InputField",
    slot: "colorIndicator",
})(() => ({
}));

const StyledColorMenuItem = styled(MenuItem)({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 32,
});

const StyledColorSwatch = styled('div')({
    width: "1em",
    height: "1em",
    borderRadius: 4,
    border: '1px solid rgba(0, 0, 0, 0.2)',
    flexShrink: 0,
});

export const ColorField: React.FC<ColorFieldProps> = (props) => {
    const {
        value: controlledValue,
        onChange,
        inputProps,
        picker,
        size = 'medium',
        color = 'main',
        defaultValue,
        ...other
    } = props;

    const [uncontrolledValue, setUncontrolledValue] = React.useState<string>(defaultValue ?? "");
    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : uncontrolledValue;

    const [colorPickerAnchoreEl, setColorPickerAnchoreEl] = React.useState<null | HTMLElement>(null);
    const [colorMenuAnchorEl, setColorMenuAnchorEl] = React.useState<null | HTMLElement>(null);
    const { t } = useTranslation();
    const theme = useTheme();

    const handleColorPickerOpen = (event: React.MouseEvent<HTMLElement>) => {
        setColorPickerAnchoreEl(event.currentTarget);
    };

    const handleColorPickerClose = () => {
        setColorPickerAnchoreEl(null);
    };

    const handleColorMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setColorMenuAnchorEl(event.currentTarget);
    };

    const handleColorMenuClose = () => {
        setColorMenuAnchorEl(null);
    };

    const handleColorSelect = (selectedColor: string) => {
        if (onChange) {
            onChange(selectedColor);
        } else {
            setUncontrolledValue(selectedColor);
        }
        handleColorMenuClose();
    };

    const handlePickerChange = (selectedColor: string) => {
        if (onChange) {
            onChange(selectedColor);
        } else {
            setUncontrolledValue(selectedColor);
        }
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.altKey && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
            event.preventDefault();
            if (!colorMenuAnchorEl) {
                setColorMenuAnchorEl(event.currentTarget);
            } else {
                handleColorMenuClose();
            }
        }
        inputProps?.onKeyDown?.(event);
    };

    return (
        <BaseInputField
            value={value}
            type="color"
            size={size}
            color={color}
            onChange={(val) => {
                if (onChange) {
                    onChange(val);
                } else {
                    setUncontrolledValue(val);
                }
            }}
            inputProps={{
                type: 'text',
                ...inputProps,
                onKeyDown: handleKeyDown,
            }}
            inputAdornments={[
                <Adornment
                    key="colorControls"
                    position="input"
                >
                    <ButtonGroup>
                        <Tooltip title={t("pick-a-color", "Pick a color")}>
                            <ToolButton
                                onClick={handleColorPickerOpen}
                                size={size}
                                color={color}
                                dense
                            >
                                <StyledInputFieldColorIndicator
                                    className={clsx(
                                        'ColorField-indicator',
                                        `size-${size}`,
                                        `color-${color}`
                                    )}
                                    style={{
                                        backgroundColor: value || '#000000',
                                    }}
                                />
                            </ToolButton>
                        </Tooltip>
                        <Tooltip title={t("select-color", "Select color")}>
                            <ToolButton
                                onClick={handleColorMenuOpen}
                                size={size}
                                color={color}
                                dense
                            >
                                {Boolean(colorMenuAnchorEl) ? <theme.icons.ExpandLess /> : <theme.icons.ExpandMore />}
                            </ToolButton>
                        </Tooltip>
                    </ButtonGroup>

                    <Menu
                        anchorEl={colorMenuAnchorEl}
                        open={Boolean(colorMenuAnchorEl)}
                        onClose={handleColorMenuClose}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                        }}
                        slotProps={{
                            paper: {
                                style: {
                                    maxHeight: 300,
                                    width: 200,
                                },
                            },
                        }}
                    >
                        {htmlColors.map((name) => (
                            <StyledColorMenuItem
                                key={name}
                                onClick={() => handleColorSelect(name)}
                                selected={value === name}
                            >
                                <StyledColorSwatch
                                    style={{ backgroundColor: name }}
                                />
                                {name}
                            </StyledColorMenuItem>
                        ))}
                    </Menu>

                    <ColorPicker
                        value={value || "#000000"}
                        onChange={handlePickerChange}
                        anchorEl={colorPickerAnchoreEl}
                        onClose={handleColorPickerClose}
                        picker={picker}
                    />
                </Adornment>,
            ]}
            {...other}
        />
    );
};

ColorField.displayName = "ColorField";

