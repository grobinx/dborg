import React from 'react';
import { styled, SxProps, Theme } from '@mui/material';
import { Size } from '@renderer/types/sizes';
import clsx from '@renderer/utils/clsx';
import { BaseButtonProps } from '@renderer/components/buttons/BaseButtonProps';
import { ThemeColor } from '@renderer/types/colors';
import { useVisibleState } from '@renderer/hooks/useVisibleState';

// Styled component dla grupy przycisków
const StyledButtonGroup = styled('div', {
    name: "ButtonGroup",
    slot: "root",
    shouldForwardProp: (prop) => !['maxWidth'].includes(prop as string),
})<{
    maxWidth?: number;
}>(({ maxWidth }) => ({
    display: 'inline-flex',
    gap: 0,

    // Pozycjonowanie przycisków - usuń border radius z środkowych
    '&.orientation-horizontal': {
        flexDirection: 'row',
        '& .ButtonGroup-button': {
            marginLeft: 0, // Nakładanie borders dla seamless look

            '&:first-of-type': {
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                marginLeft: 0,
            },

            '&:last-of-type': {
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
            },

            '&:not(:first-of-type):not(:last-of-type)': {
                borderRadius: 0,
            },

            '&:only-of-type': {
                marginLeft: 0,
            },

            // Z-index dla hover/focus effects
            '&:hover, &:focus, &.selected': {
                zIndex: 1,
            },
        },
    },
    '&.orientation-vertical': {
        flexDirection: 'column',

        '& .ButtonGroup-button': {
            marginTop: -1, // Nakładanie borders dla seamless look

            '&:first-of-type': {
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                marginTop: 0,
            },

            '&:last-of-type': {
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
            },

            '&:not(:first-of-type):not(:last-of-type)': {
                borderRadius: 0,
            },

            '&:only-of-type': {
                marginTop: 0,
            },

            // Z-index dla hover/focus effects
            '&:hover, &:focus, &.selected': {
                zIndex: 1,
            },
        },
    },

    // Same size modifier classes
    '&.same-size': {
        '&.orientation-horizontal': {
            '& .ButtonGroup-button': {
                ...(maxWidth && {
                    width: `${maxWidth}px !important`,
                    minWidth: `${maxWidth}px !important`,
                    maxWidth: `${maxWidth}px !important`,
                    flexShrink: 0,
                    flexGrow: 0,
                    flexBasis: 'auto',
                }),
            },
        },

        '&.orientation-vertical': {
            alignItems: 'stretch',

            '& .ButtonGroup-button': {
                ...(maxWidth && {
                    width: `${maxWidth}px !important`,
                    minWidth: `${maxWidth}px !important`,
                }),
            },
        },
    },
}));

// Props dla ButtonGroup
export interface ButtonGroupProps {
    children?: React.ReactNode;
    orientation?: 'horizontal' | 'vertical';
    size?: Size;
    color?: ThemeColor;
    disabled?: boolean;
    dense?: boolean;
    /**
     * Czy wszystkie przyciski mają mieć taką samą szerokość
     * Dopasowuje wszystkie do najszerszego
     * @default false
     */
    sameSize?: boolean;
    /**
     * Czy tylko jeden przycisk może być wybrany jednocześnie
     * W trybie exclusive, każdy przycisk ma toggle ustawiony na swoją wartość
     * @default false
     */
    exclusive?: boolean;
    /**
     * Wartość aktualnie wybranego przycisku (dla trybu exclusive)
     */
    value?: string | null;
    /**
     * Callback wywoływany gdy zmieni się wybrana wartość
     */
    onChange?: (value: string | null) => void;
    className?: string;
    sx?: SxProps<Theme>;
    style?: React.CSSProperties;

    width?: string | number;
    height?: string | number;
}

// Główny komponent ButtonGroup
export const ButtonGroup: React.FC<ButtonGroupProps> = ({
    children,
    orientation = 'horizontal',
    size = 'medium',
    dense,
    color = 'main',
    disabled = false,
    sameSize: sameWidth = false,
    exclusive = false,
    value,
    onChange,
    className,
    width, height, style,
    ...other
}) => {
    const [maxWidth, setMaxWidth] = React.useState<number | undefined>(undefined);
    const [currentValue, setCurrentValue] = React.useState<string | null | undefined>(value);
    const [groupRef, isVisible] = useVisibleState<HTMLDivElement>();

    React.useLayoutEffect(() => {
        if (!sameWidth || !groupRef.current || !isVisible) {
            if (maxWidth !== undefined) setMaxWidth(undefined);
            return;
        }

        const group = groupRef.current;
        const hadSameWidth = group.classList.contains('same-size');

        // Tymczasowo wyłącz wymuszanie szerokości
        if (hadSameWidth) group.classList.remove('same-size');

        const buttons = group.querySelectorAll('.ButtonGroup-button');
        if (!buttons.length) {
            if (hadSameWidth) group.classList.add('same-size');
            return;
        }

        // Wyczyść inline width na czas pomiaru
        buttons.forEach((b) => {
            const el = b as HTMLElement;
            el.style.width = '';
            el.style.minWidth = '';
            el.style.maxWidth = '';
            el.style.flexGrow = '';
            el.style.flexShrink = '';
            el.style.flexBasis = '';
        });

        // Wymuś reflow
        group.getBoundingClientRect();

        // Zmierz naturalne szerokości
        let max = 0;
        buttons.forEach((b) => {
            const el = b as HTMLElement;
            const w = Math.max(el.scrollWidth, el.offsetWidth);
            max = Math.max(max, w);
        });

        // Przywróć klasę
        if (hadSameWidth) group.classList.add('same-size');

        const next = max > 0 ? Math.ceil(max) : undefined;
        if (next !== maxWidth) setMaxWidth(next);
    }, [sameWidth, children, size, isVisible]); // usuń isCalculated z deps

    const handleExclusiveChange = React.useCallback((newValue: string | null) => {
        setCurrentValue(prev => {
            if (prev !== newValue) {
                onChange?.(newValue);
            }
            return newValue;
        });
    }, []);

    React.useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    // Clone children i dodaj className oraz przekaż props
    const processedChildren = React.Children.map(children, (child) => {
        if (React.isValidElement<BaseButtonProps>(child)) {
            if (exclusive && typeof child.props.toggle !== 'string') {
                console.error("<ButtonGroup> requires all children to be toggle (string) buttons when exclusive is true.");
                exclusive = false;
            }
            return React.cloneElement(child, {
                ...child.props,
                className: clsx('ButtonGroup-button', child.props.className),
                size: child.props.size || size,
                dense: child.props.dense || dense,
                color: child.props.color || color,
                disabled: child.props.disabled || disabled,
                value: exclusive ? (currentValue === child.props.toggle ? currentValue : null) : child.props.value,
                onChange: (newValue: string | null) => {
                    child.props.onChange?.(newValue !== child.props.toggle ? null : newValue);
                    if (exclusive && newValue && newValue !== currentValue) {
                        handleExclusiveChange(newValue);
                    }
                },
            });
        }
        return child;
    });

    return (
        <StyledButtonGroup
            ref={groupRef}
            className={clsx(
                'ButtonGroup-root',
                `size-${size}`,
                `color-${color}`,
                `orientation-${orientation}`,
                disabled && 'disabled',
                sameWidth && 'same-size',
                exclusive && 'exclusive',
                className
            )}
            maxWidth={maxWidth}
            style={{ width, height, ...style }}
            {...other}
        >
            {processedChildren}
        </StyledButtonGroup>
    );
};

export default ButtonGroup;