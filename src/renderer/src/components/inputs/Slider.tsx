import React from 'react';
import { styled } from '@mui/material';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import clsx from '@renderer/utils/clsx';
import { calculateTextWidth } from '../DataGrid/DataGridUtils';

interface SliderProps {
    value: number;
    min: number;
    max: number;
    step: number;
    scale?: boolean | number;
    legend?: string[];
    disabled?: boolean;
    onChange?: (value: number) => void;
    onFocus?: () => void;
    onBlur?: () => void;
}

interface RangeProps {
    value: [number, number]; // [minValue, maxValue]
    min: number;
    max: number;
    step: number;
    distance?: number;
    scale?: boolean | number;
    legend?: string[];
    disabled?: boolean;
    onChange?: (value: [number, number]) => void;
    onFocus?: () => void;
    onBlur?: () => void;
}


const StyledSlider = styled('div', {
    name: "Slider",
    slot: "root",
})(() => ({
    display: 'flex',
    alignItems: 'center',
    //gap: "0.7em",
    width: '100%',
    height: '100%',
    //padding: '0 0.5em 0 0.5em',
}));

const StyledSliderContainer = styled('div', {
    name: "Slider",
    slot: "container",
})(() => ({
    position: 'relative',
    width: '100%',
    height: '1em',
    cursor: 'pointer',
    userSelect: 'none',
    outline: 'none',
    margin: '0 0.5em',
}));

const StyledSliderTrack = styled('div', {
    name: "Slider",
    slot: "track",
})(({ theme }) => ({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '100%',
    height: '0.3em',
    backgroundColor: theme.palette.divider,
    borderRadius: '2px',
    flexGrow: 1,
    //padding: '0 0.5em',
}));

const StyledSliderProgress = styled('div', {
    name: "Slider",
    slot: "progress",
})<{ progress?: number, start?: number, end?: number }>(({ theme, start, end, progress }) => ({
    position: 'absolute',
    top: '50%',
    left: start !== undefined ? `${start}%` : '0',
    transform: 'translateY(-50%)',
    width: progress !== undefined ? `${progress}%` : `${(end ?? 100) - (start ?? 0)}%`,
    height: '0.4em',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '2px',
    transition: 'left 0.1s ease, width 0.1s ease',
}));

const StyledSliderThumb = styled('div', {
    name: "Slider",
    slot: "thumb",
})<{ position: number }>(({ theme, position }) => ({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    left: `calc(${position}% - 0.5em)`,
    width: '1em',
    height: '1em',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '50%',
    border: `2px solid ${theme.palette.background.paper}`,
    boxShadow: theme.shadows[3],
    transition: 'left 0.1s ease, transform 0.1s ease',
    '&:hover': {
        transform: 'translateY(-50%) scale(1.1)',
    },
    '&:active': {
        transform: 'translateY(-50%) scale(1.2)',
        animation: 'thumbSelect 0.3s ease-out', // Dodanie animacji
    },
    '@keyframes thumbSelect': {
        '0%': {
            transform: 'translateY(-50%) scale(1.5)', // Powiększenie
        },
        '100%': {
            transform: 'translateY(-50%) scale(1.2)', // Powrót do rozmiaru z :active
        },
    },
}));

const StyledBaseSliderLegend = styled('div', {
    name: "Slider",
    slot: "legend",
})(({ theme }) => ({
    fontSize: "0.9em",
    lineHeight: "1.3em",
    backgroundColor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
    borderRadius: theme.shape.borderRadius,
    width: 50,
    //padding: '0 0.3em',
    textAlign: "center",
    ...Array.from({ length: 10 }, (_, i) => i + 1).reduce((acc, i) => {
        acc[`&.units-${i}`] = {
            minWidth: `${i * 0.7}em`,
        };
        return acc;
    }, {}),
}));

const StyledSliderScale = styled('div', {
    name: "Slider",
    slot: "scale",
})(({ theme }) => ({
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: '1em',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    fontSize: '0.7rem',
    color: theme.palette.text.secondary,
    pointerEvents: 'none',
}));

const StyledSliderScaleTick = styled('div', {
    name: "Slider",
    slot: "scaleTick",
})<{ isActive?: boolean }>(({ theme, isActive }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    '&::before': {
        content: '""',
        position: 'absolute',
        width: '1px',
        height: '0.8em',
        backgroundColor: isActive ? theme.palette.primary.main : theme.palette.divider,
    },
}));

export const Slider: React.FC<SliderProps> = ({
    value,
    min: initMin = 0,
    max: initMax = 100,
    step: initStep = 1,
    scale = 10,
    legend,
    disabled,
    onChange,
    onFocus,
    onBlur,
}) => {
    const sliderRef = React.useRef<HTMLDivElement>(null);
    const isDragging = React.useRef(false);

    // Obsługa legend w komponencie slidera
    const { min, max, step, maxLengthUnit, displayValue, currentValue } = React.useMemo(() => {
        const hasLabels = legend && legend.length > 0;
        const calculatedMin = hasLabels ? 0 : initMin;
        const calculatedMax = hasLabels ? legend.length - 1 : initMax;
        const calculatedStep = hasLabels ? 1 : initStep;
        const calculatedMaxLengthUnit = hasLabels
            ? (legend.reduce((maxLenUnit, label) => Math.max(maxLenUnit, Math.ceil((calculateTextWidth(label, 14) ?? (label.length * 14)) / 10)), 0) + 1)
            : String(calculatedMax).length;

        const safeValue = Math.min(Math.max(value ?? calculatedMin, calculatedMin), calculatedMax);
        const calculatedDisplayValue = hasLabels
            ? legend[safeValue] || legend[0]
            : safeValue;

        if (value !== safeValue) {
            Promise.resolve().then(() => onChange?.(safeValue));
        }

        return {
            min: calculatedMin,
            max: calculatedMax,
            step: calculatedStep,
            maxLengthUnit: calculatedMaxLengthUnit,
            displayValue: calculatedDisplayValue,
            currentValue: safeValue
        };
    }, [legend, initMin, initMax, initStep, value]);

    const progressPercentage = max === min ? 0 : ((currentValue - min) / (max - min)) * 100;
    const shouldShowScale = typeof scale === 'number' ? (max - min) <= scale && (max - min) > 1 : !!scale;

    const getValueFromPosition = React.useCallback((clientX: number) => {
        if (!sliderRef.current) return currentValue;
        const rect = sliderRef.current.getBoundingClientRect();
        const percentage = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
        const rawValue = min + (percentage * (max - min));
        const steppedValue = Math.round(rawValue / step) * step;
        return Math.min(Math.max(steppedValue, min), max);
    }, [min, max, step, currentValue]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (disabled) return;
        const element = e.currentTarget as HTMLElement;
        if (element?.focus) element.focus();
        e.preventDefault();
        isDragging.current = true;
        const newValue = getValueFromPosition(e.clientX);
        onChange?.(newValue);
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current || disabled) return;
        e.preventDefault();
        const newValue = getValueFromPosition(e.clientX);
        onChange?.(newValue);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = false;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;
        let newValue = currentValue;
        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowDown':
                newValue = Math.max(currentValue - step, min);
                break;
            case 'ArrowRight':
            case 'ArrowUp':
                newValue = Math.min(currentValue + step, max);
                break;
            case 'Home':
                newValue = min;
                break;
            case 'End':
                newValue = max;
                break;
            case 'PageDown':
                newValue = Math.max(currentValue - step * 10, min);
                break;
            case 'PageUp':
                newValue = Math.min(currentValue + step * 10, max);
                break;
            default:
                return;
        }
        e.preventDefault();
        onChange?.(newValue);
    };

    const scaleValues = shouldShowScale
        ? Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step)
        : [];

    return (
        <StyledSlider className={clsx("Slider-root")}>
            <StyledSliderContainer
                className={clsx("Slider-container")}
                ref={sliderRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onKeyDown={handleKeyDown}
                tabIndex={disabled ? -1 : 0}
                role="slider"
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={currentValue}
                aria-valuetext={String(displayValue)}
                aria-disabled={disabled}
                onFocus={onFocus}
                onBlur={onBlur}
            >
                {shouldShowScale && (
                    <StyledSliderScale className={clsx("Slider-scale")}>
                        {scaleValues.map((value) => (
                            <StyledSliderScaleTick
                                key={value}
                                className={clsx(
                                    "Slider-scaleTick",
                                    value === currentValue && 'active'
                                )}
                            >
                            </StyledSliderScaleTick>
                        ))}
                    </StyledSliderScale>
                )}
                <StyledSliderTrack className={clsx("Slider-track")} />
                <StyledSliderProgress progress={progressPercentage} className={clsx("Slider-progress")} />
                <StyledSliderThumb position={progressPercentage} className={clsx("Slider-thumb")} />
            </StyledSliderContainer>

            <StyledBaseSliderLegend
                className={clsx(
                    'Slider-legend',
                    `units-${maxLengthUnit}`
                )}
            >
                {displayValue}
            </StyledBaseSliderLegend>
        </StyledSlider>
    );
};

Slider.displayName = 'Slider';

export const Range: React.FC<RangeProps> = ({
    value,
    min: initMin = 0,
    max: initMax = 100,
    step: initStep = 1,
    distance = 0,
    scale = 10,
    legend,
    disabled,
    onChange,
    onFocus,
    onBlur
}) => {
    const [minValue, maxValue] = value ?? [initMin, initMax];
    const sliderRef = React.useRef<HTMLDivElement>(null);
    const isDragging = React.useRef<"min" | "max" | null>(null);

    // Obsługa legend w komponencie slidera
    const { min, max, step, maxLengthUnit, displayMinValue, displayMaxValue, currentMinValue, currentMaxValue } = React.useMemo(() => {
        const hasLabels = legend && legend.length > 0;
        const calculatedMin = hasLabels ? 0 : initMin;
        const calculatedMax = hasLabels ? legend.length - 1 : initMax;
        const calculatedStep = hasLabels ? 1 : initStep;
        const calculatedMaxLengthUnit = hasLabels
            ? (legend.reduce((maxLenUnit, label) => Math.max(maxLenUnit, Math.ceil((calculateTextWidth(label, 14) ?? (label.length * 14)) / 10)), 0) + 1)
            : String(calculatedMax).length;

        let safeMinValue = Math.min(Math.max(minValue ?? calculatedMin, calculatedMin), calculatedMax);
        let safeMaxValue = Math.min(Math.max(maxValue ?? calculatedMin, calculatedMin), calculatedMax);
        
        // Sprawdzenie minimalnej odległości
        if (safeMaxValue - safeMinValue < distance) {
            // Jeśli odległość jest za mała, dostosuj wartości
            const center = (safeMinValue + safeMaxValue) / 2;
            const halfDistance = distance / 2;
            
            safeMinValue = Math.max(calculatedMin, center - halfDistance);
            safeMaxValue = Math.min(calculatedMax, center + halfDistance);
            
            // Jeśli nadal nie można zachować distance, przesunięcie w kierunku granic
            if (safeMaxValue - safeMinValue < distance) {
                if (safeMinValue === calculatedMin) {
                    safeMaxValue = Math.min(calculatedMax, safeMinValue + distance);
                } else if (safeMaxValue === calculatedMax) {
                    safeMinValue = Math.max(calculatedMin, safeMaxValue - distance);
                }
            }
        }

        const calculatedDisplayMinValue = hasLabels
            ? legend[safeMinValue] || legend[0]
            : safeMinValue;
        const calculatedDisplayMaxValue = hasLabels
            ? legend[safeMaxValue] || legend[0]
            : safeMaxValue;

        if (minValue !== safeMinValue || maxValue !== safeMaxValue) {
            Promise.resolve().then(() => onChange?.([safeMinValue, safeMaxValue]));
        }

        return {
            min: calculatedMin,
            max: calculatedMax,
            step: calculatedStep,
            maxLengthUnit: calculatedMaxLengthUnit,
            displayMinValue: calculatedDisplayMinValue,
            displayMaxValue: calculatedDisplayMaxValue,
            currentMinValue: safeMinValue,
            currentMaxValue: safeMaxValue
        };
    }, [legend, initMin, initMax, initStep, minValue, maxValue, distance]);

    const shouldShowScale = typeof scale === 'number' ? (max - min) <= scale && (max - min) > 1 : !!scale;

    const getValueFromPosition = React.useCallback((clientX: number) => {
        if (!sliderRef.current) return min;
        const rect = sliderRef.current.getBoundingClientRect();
        const percentage = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
        const rawValue = min + (percentage * (max - min));
        const steppedValue = Math.round(rawValue / step) * step;
        return Math.min(Math.max(steppedValue, min), max);
    }, [min, max, step]);

    const handleTrackClick = (e: React.MouseEvent) => {
        if (disabled || isDragging.current) return;
        
        const element = e.currentTarget as HTMLElement;
        if (element?.focus) element.focus();
        
        const clickValue = getValueFromPosition(e.clientX);
        
        // Sprawdź który thumb jest bliżej kliknięcia
        const distanceToMin = Math.abs(clickValue - currentMinValue);
        const distanceToMax = Math.abs(clickValue - currentMaxValue);
        
        if (distanceToMin <= distanceToMax) {
            // Przesuń min thumb
            const newMinValue = Math.min(clickValue, currentMaxValue - distance);
            onChange?.([Math.max(newMinValue, min), currentMaxValue]);
        } else {
            // Przesuń max thumb
            const newMaxValue = Math.max(clickValue, currentMinValue + distance);
            onChange?.([currentMinValue, Math.min(newMaxValue, max)]);
        }
    };

    const handlePointerDown = (e: React.PointerEvent, thumb: "min" | "max") => {
        if (disabled) return;
        e.stopPropagation(); // Zatrzymaj propagację żeby nie wywołać handleTrackClick
        isDragging.current = thumb;
        const newValue = getValueFromPosition(e.clientX);
        
        if (thumb === "min") {
            const newMinValue = Math.min(newValue, currentMaxValue - distance);
            onChange?.([Math.max(newMinValue, min), currentMaxValue]);
        } else {
            const newMaxValue = Math.max(newValue, currentMinValue + distance);
            onChange?.([currentMinValue, Math.min(newMaxValue, max)]);
        }
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current || disabled) return;
        e.preventDefault();
        const newValue = getValueFromPosition(e.clientX);
        
        if (isDragging.current === "min") {
            const newMinValue = Math.min(newValue, currentMaxValue - distance);
            onChange?.([Math.max(newMinValue, min), currentMaxValue]);
        } else {
            const newMaxValue = Math.max(newValue, currentMinValue + distance);
            onChange?.([currentMinValue, Math.min(newMaxValue, max)]);
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging.current) return;
        isDragging.current = null;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;
        let newMinValue = currentMinValue;
        let newMaxValue = currentMaxValue;
        
        const isShiftPressed = e.shiftKey;
        
        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowDown':
                if (isShiftPressed) {
                    // Shift + strzałka - przesuń tylko min thumb w lewo/dół
                    newMinValue = Math.max(currentMinValue - step, min);
                    // Upewnij się, że zachowana jest minimalna odległość
                    if (newMinValue > currentMaxValue - distance) {
                        newMinValue = Math.max(currentMaxValue - distance, min);
                    }
                } else {
                    // Bez Shift - przesuń oba thumby w lewo/dół
                    //newMinValue = Math.max(currentMinValue - step, min);
                    newMaxValue = Math.max(currentMaxValue - step, newMinValue + distance);
                }
                break;
            case 'ArrowRight':
            case 'ArrowUp':
                if (isShiftPressed) {
                    // Shift + strzałka - przesuń tylko max thumb w prawo/górę
                    newMaxValue = Math.min(currentMaxValue + step, max);
                    // Upewnij się, że zachowana jest minimalna odległość
                    if (newMaxValue < currentMinValue + distance) {
                        newMaxValue = Math.min(currentMinValue + distance, max);
                    }
                } else {
                    // Bez Shift - przesuń oba thumby w prawo/górę
                    // newMaxValue = Math.min(currentMaxValue + step, max);
                    newMinValue = Math.min(currentMinValue + step, newMaxValue - distance);
                }
                break;
            case 'Home':
                if (isShiftPressed) {
                    newMaxValue = Math.max(currentMinValue - distance, min);
                } else {
                    newMinValue = min;
                }
                break;
            case 'End':
                if (isShiftPressed) {
                    newMinValue = Math.min(currentMaxValue + distance, max);
                } else {
                    newMaxValue = max;
                }
                break;
            default:
                return;
        }
        e.preventDefault();
        onChange?.([newMinValue, newMaxValue]);
    };

    const minPercentage = ((currentMinValue - min) / (max - min)) * 100;
    const maxPercentage = ((currentMaxValue - min) / (max - min)) * 100;

    const scaleValues = shouldShowScale
        ? Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step)
        : [];

    return (
        <StyledSlider className={clsx("Slider-root")}>
            <StyledBaseSliderLegend
                className={clsx(
                    'Slider-legend',
                    `units-${maxLengthUnit}`,
                    'min'
                )}
            >
                {displayMinValue}
            </StyledBaseSliderLegend>
            <StyledSliderContainer
                className={clsx("Slider-container")}
                ref={sliderRef}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onMouseDown={handleTrackClick}
                onKeyDown={handleKeyDown}
                tabIndex={disabled ? -1 : 0}
                role="slider"
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuetext={`${currentMinValue} - ${currentMaxValue}`}
                aria-disabled={disabled}
                onFocus={onFocus}
                onBlur={onBlur}
            >
                {shouldShowScale && (
                    <StyledSliderScale className={clsx("Slider-scale")}>
                        {scaleValues.map((value) => (
                            <StyledSliderScaleTick
                                key={value}
                                className={clsx(
                                    "Slider-scaleTick",
                                    (value === currentMinValue || value === currentMaxValue) && 'active'
                                )}
                            >
                            </StyledSliderScaleTick>
                        ))}
                    </StyledSliderScale>
                )}
                <StyledSliderTrack className={clsx("Slider-track")} />
                <StyledSliderProgress start={minPercentage} end={maxPercentage} className={clsx("Slider-progress")} />
                <StyledSliderThumb 
                    position={minPercentage} 
                    className={clsx("Slider-thumb", "min")}
                    onPointerDown={(e) => handlePointerDown(e, "min")}
                />
                <StyledSliderThumb 
                    position={maxPercentage} 
                    className={clsx("Slider-thumb", "max")}
                    onPointerDown={(e) => handlePointerDown(e, "max")}
                />
            </StyledSliderContainer>
            <StyledBaseSliderLegend
                className={clsx(
                    'Slider-legend',
                    `units-${maxLengthUnit}`,
                    'max'
                )}
            >
                {displayMaxValue}
            </StyledBaseSliderLegend>
        </StyledSlider>
    );
};

Range.displayName = 'Range';
