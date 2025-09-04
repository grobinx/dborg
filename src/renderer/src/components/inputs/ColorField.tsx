import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { validateMaxLength, validateMinLength } from './base/useValidation';
import { Adornment, BaseInputField } from './base/BaseInputField';
import Tooltip from '../Tooltip';
import { ToolButton } from '../buttons/ToolButton';
import ColorPicker, { ColorPickerType } from '../useful/ColorPicker';
import { styled, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import clsx from '@renderer/utils/clsx';

interface ColorFieldProps extends BaseInputProps {
    placeholder?: FormattedContentItem;
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    picker?: ColorPickerType;
}

const StyledInputFieldColorIndicator = styled('div', {
    name: "InputField",
    slot: "colorIndicator",
})(() => ({
}));

export const ColorField: React.FC<ColorFieldProps> = (props) => {
    const {
        value,
        onChange,
        inputProps,
        picker,
        size,
        color,
        ...other
    } = props;

    //const decorator = useInputDecorator();
    const [colorPickerAnchoreEl, setColorPickerAnchoreEl] = React.useState<null | HTMLElement>(null);
    const { t } = useTranslation();

    const handleColorPickerOpen = (event: React.MouseEvent<HTMLElement>) => {
        setColorPickerAnchoreEl(event.currentTarget);
    };

    const handleColorPickerClose = () => {
        setColorPickerAnchoreEl(null);
    };

    return (
        <BaseInputField
            value={value}
            type="color"
            size={size}
            color={color}
            inputProps={{
                type: 'text',
                ...inputProps,
            }}
            inputAdornments={
                [
                    <Adornment
                        key="picker"
                        position="end"
                    >
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
                        <ColorPicker
                            value={value || "#000000"}
                            onChange={(value) => onChange?.(value)}
                            anchorEl={colorPickerAnchoreEl}
                            onClose={handleColorPickerClose}
                            picker={picker}
                        />
                    </Adornment>,
                ]
            }
            {...other}
        />
    )
};

ColorField.displayName = "ColorField";

