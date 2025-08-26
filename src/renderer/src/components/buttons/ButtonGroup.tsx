import React from 'react';
import { styled, SxProps, Theme } from '@mui/material';
import { borderRadius } from '@renderer/themes/layouts/default/consts';
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
            borderRadius: 0,
            marginLeft: 0, // Nakładanie borders dla seamless look

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
        },
    },
    '&.orientation-vertical': {
        flexDirection: 'column',

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
        },
    },

    // Same width modifier classes
    '&.same-width': {
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
    children?: React.ReactElement<BaseButtonProps> | React.ReactElement<BaseButtonProps>[];
    orientation?: 'horizontal' | 'vertical';
    size?: Size;
    color?: ThemeColor;
    disabled?: boolean;
    /**
     * Czy wszystkie przyciski mają mieć taką samą szerokość
     * Dopasowuje wszystkie do najszerszego
     * @default false
     */
    sameWidth?: boolean;
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
}

// Główny komponent ButtonGroup
export const ButtonGroup: React.FC<ButtonGroupProps> = ({
    children,
    orientation = 'horizontal',
    size = 'medium',
    color = 'main',
    disabled = false,
    sameWidth = false,
    exclusive = false,
    value,
    onChange,
    className,
    sx,
}) => {
    const [maxWidth, setMaxWidth] = React.useState<number | undefined>(undefined);
    const [isCalculated, setIsCalculated] = React.useState(false);
    const [currentValue, setCurrentValue] = React.useState<string | null | undefined>(value);
    const [groupRef, isVisible] = useVisibleState<HTMLDivElement>();

    // Efekt do obliczania maksymalnej szerokości
    React.useLayoutEffect(() => {
        if (!sameWidth || !groupRef.current) {
            setMaxWidth(undefined);
            setIsCalculated(false);
            return;
        }

        if (!isVisible) {
            return;
        }

        const calculateMaxWidth = () => {
            const buttons = groupRef.current?.querySelectorAll('.ButtonGroup-button');
            if (!buttons || buttons.length === 0) return;

            // Tymczasowo usuń style szerokości i pokaż w naturalnym stanie
            buttons.forEach((button) => {
                const btn = button as HTMLElement;
                btn.style.width = '';
                btn.style.minWidth = '';
                btn.style.maxWidth = '';
                btn.style.flexShrink = '';
                btn.style.flexGrow = '';
                btn.style.flexBasis = '';
            });

            // Wymuś reflow
            groupRef.current?.offsetHeight;

            // Teraz zmierz
            let maxButtonWidth = 0;
            buttons.forEach((button) => {
                // Użyj scrollWidth zamiast getBoundingClientRect
                const scrollWidth = (button as HTMLElement).scrollWidth;
                const offsetWidth = (button as HTMLElement).offsetWidth;

                // Weź większą z wartości
                const naturalWidth = Math.max(scrollWidth, offsetWidth);
                maxButtonWidth = Math.max(maxButtonWidth, naturalWidth);
            });

            if (maxButtonWidth > 0) {
                setMaxWidth(Math.ceil(maxButtonWidth));
                setIsCalculated(true);
            }
        };

        calculateMaxWidth();
        // Opóźnij obliczenie, żeby komponenty się w pełni wyrenderowały
        // const timeoutId = setTimeout(calculateMaxWidth, 100);

        // return () => {
        //     clearTimeout(timeoutId);
        // };
    }, [sameWidth, children, size, isCalculated, isVisible]);

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
                disabled && `disabled`,
                sameWidth && `same-width`,
                exclusive && `exclusive`,
                className
            )}
            maxWidth={maxWidth}
            sx={sx}
        >
            {processedChildren}
        </StyledButtonGroup>
    );
};

export default ButtonGroup;