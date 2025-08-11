import React from 'react';
import { styled, SxProps, Theme } from '@mui/material';
import { borderRadius } from '@renderer/themes/layouts/default/consts';
import { Size } from '@renderer/types/sizes';
import clsx from '@renderer/utils/clsx';
import { BaseButtonProps } from '@renderer/components/buttons/BaseButtonProps';
import { ThemeColor } from '@renderer/types/colors';

// Styled component dla grupy przycisków
const StyledButtonGroup = styled('div', {
    name: "ButtonGroup",
    slot: "root",
})<{ 
    orientation?: 'horizontal' | 'vertical';
}>(({ orientation = 'horizontal' }) => ({
    display: 'inline-flex',
    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
    gap: 0,
    
    // Pozycjonowanie przycisków - usuń border radius z środkowych
    ...(orientation === 'horizontal' ? {
        '& .ButtonGroup-button': {
            borderRadius: 0,
            marginLeft: -1, // Nakładanie borders dla seamless look
            
            '&:first-of-type': {
                borderTopLeftRadius: borderRadius,
                borderBottomLeftRadius: borderRadius,
                marginLeft: 0,
            },
            
            '&:last-of-type': {
                borderTopRightRadius: borderRadius,
                borderBottomRightRadius: borderRadius,
            },
            
            '&:only-of-type': {
                borderRadius: borderRadius,
                marginLeft: 0,
            },
            
            // Z-index dla hover/focus effects
            '&:hover, &:focus, &.selected': {
                zIndex: 1,
            },
        }
    } : {
        '& .ButtonGroup-button': {
            borderRadius: 0,
            marginTop: -1, // Nakładanie borders dla seamless look
            
            '&:first-of-type': {
                borderTopLeftRadius: borderRadius,
                borderTopRightRadius: borderRadius,
                marginTop: 0,
            },
            
            '&:last-of-type': {
                borderBottomLeftRadius: borderRadius,
                borderBottomRightRadius: borderRadius,
            },
            
            '&:only-of-type': {
                borderRadius: borderRadius,
                marginTop: 0,
            },
            
            // Z-index dla hover/focus effects
            '&:hover, &:focus, &.selected': {
                zIndex: 1,
            },
        }
    }),
}));

// Props dla ButtonGroup
export interface ButtonGroupProps {
    children?: React.ReactElement<BaseButtonProps> | React.ReactElement<BaseButtonProps>[];
    orientation?: 'horizontal' | 'vertical';
    size?: Size;
    color?: ThemeColor;
    disabled?: boolean;
    className?: string;
    sx?: SxProps<Theme>;
}

// Główny komponent ButtonGroup
export const ButtonGroup: React.FC<ButtonGroupProps> = ({
    children,
    orientation = 'horizontal',
    size = 'medium',
    color,
    disabled = false,
    className,
    sx,
}) => {
    // Clone children i dodaj className oraz przekaż props
    const processedChildren = React.Children.map(children, (child) => {
        if (React.isValidElement<BaseButtonProps>(child)) {
            return React.cloneElement(child, {
                ...child.props,
                className: clsx('ButtonGroup-button', child.props.className),
                size: child.props.size || size,
                color: child.props.color || color,
                disabled: child.props.disabled || disabled,
            });
        }
        return child;
    });

    return (
        <StyledButtonGroup
            className={clsx(
                'ButtonGroup-root',
                `size-${size}`,
                `color-${color}`,
                `orientation-${orientation}`,
                disabled && `disabled`,
                className
            )}
            orientation={orientation}
            sx={sx}
        >
            {processedChildren}
        </StyledButtonGroup>
    );
};

export default ButtonGroup;