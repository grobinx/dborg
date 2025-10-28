import React from 'react';
import { styled, SxProps, Theme } from '@mui/material';
import { Size } from '@renderer/types/sizes';
import clsx from '@renderer/utils/clsx';
import { BaseButtonProps } from '@renderer/components/buttons/BaseButtonProps';
import { ThemeColor } from '@renderer/types/colors';

// Styled component dla grupy przycisków
const createStyledButtonGroup = (componentName: string) => {
    return styled('div', {
        name: componentName,
        slot: "root",
        shouldForwardProp: (prop) => !['maxWidth'].includes(prop as string),
    })<{
        maxWidth?: number;
    }>(({ maxWidth }) => ({
        // Same size modifier classes
        '&.same-size': {
            '&.orientation-horizontal': {
                [`& .${componentName}-button`]: {
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
                [`& .${componentName}-button`]: {
                    ...(maxWidth && {
                        width: `${maxWidth}px !important`,
                        minWidth: `${maxWidth}px !important`,
                    }),
                },
            },
        },
    }));
};

// Props dla ButtonGroup
export interface ButtonGroupProps {
    componentName?: string;
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
}

// Główny komponent ButtonGroup
export const ButtonGroup: React.FC<ButtonGroupProps> = ({
    componentName = "ButtonGroup",
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
    sx,
}) => {
    const [maxWidth, setMaxWidth] = React.useState<number | undefined>(undefined);
    const [currentValue, setCurrentValue] = React.useState<string | null | undefined>(value);
    const [isCalculated, setIsCalculated] = React.useState(!sameWidth); // Ukryj do czasu obliczenia
    const groupRef = React.useRef<HTMLDivElement>(null);

    React.useLayoutEffect(() => {
        if (!sameWidth) {
            if (!isCalculated) setIsCalculated(true);
            if (maxWidth !== undefined) setMaxWidth(undefined);
            return;
        }

        const group = groupRef.current;
        if (!group) return;

        const calculateMaxWidth = () => {
            const buttons = group.querySelectorAll(`.${componentName}-button`);
            if (!buttons.length) return;

            // Usuń wymuszenie szerokości na czas pomiaru
            buttons.forEach((b) => {
                const el = b as HTMLElement;
                el.style.width = '';
                el.style.minWidth = '';
                el.style.maxWidth = '';
            });

            // Wymuś reflow i zmierz
            group.getBoundingClientRect();

            let max = 0;
            buttons.forEach((b) => {
                const el = b as HTMLElement;
                const w = Math.max(el.scrollWidth, el.offsetWidth, el.getBoundingClientRect().width);
                max = Math.max(max, w);
            });

            const next = max > 0 ? Math.ceil(max) : undefined;
            if (next !== maxWidth) {
                setMaxWidth(next);
                setIsCalculated(true); // Pokaż przyciski po obliczeniu
            }
        };

        // Użyj ResizeObserver do reaktywności
        const resizeObserver = new ResizeObserver(() => {
            calculateMaxWidth();
        });

        const buttons = group.querySelectorAll(`.${componentName}-button`);
        buttons.forEach((b) => resizeObserver.observe(b as HTMLElement));

        // Pierwsza kalkulacja
        calculateMaxWidth();

        return () => {
            resizeObserver.disconnect();
        };
    }, [sameWidth, children, size, maxWidth]);

    const handleExclusiveChange = React.useCallback((newValue: string | null) => {
        setCurrentValue(prev => {
            if (prev !== newValue) {
                onChange?.(newValue);
            }
            return newValue;
        });
    }, [onChange]);

    React.useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    // Clone children i dodaj className oraz przekaż props
    const processedChildren = React.Children.map(children, (child) => {
        if (React.isValidElement<BaseButtonProps>(child)) {
            if (exclusive && typeof child.props.toggle !== 'string') {
                console.error("<ButtonGroup> requires all children to be toggle (string) buttons when exclusive is true.");
            }
            return React.cloneElement(child, {
                ...child.props,
                className: clsx(`${componentName}-button`, child.props.className),
                size: child.props.size || size,
                dense: child.props.dense || dense,
                color: child.props.color || color,
                disabled: child.props.disabled || disabled,
                value: exclusive ? (currentValue === child.props.toggle ? currentValue : null) : child.props.value,
                onChange: (newValue: string | null) => {
                    const toggle = child.props.toggle;
                    let isActive = false;
                    if (Array.isArray(toggle)) {
                        isActive = toggle.includes(newValue);
                    } else {
                        isActive = newValue === toggle;
                    }
                    child.props.onChange?.(isActive ? newValue : null);
                    if (exclusive && newValue && newValue !== currentValue) {
                        handleExclusiveChange(newValue);
                    }
                },
            });
        }
        return child;
    });

    const StyledButtonGroup = React.useMemo(() => createStyledButtonGroup(componentName), [componentName]);

    return (
        <StyledButtonGroup
            ref={groupRef}
            className={clsx(
                `${componentName}-root`,
                `size-${size}`,
                `color-${color}`,
                `orientation-${orientation}`,
                disabled && 'disabled',
                sameWidth && 'same-size',
                exclusive && 'exclusive',
                !isCalculated && 'calculating', // Ukryj podczas obliczania
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