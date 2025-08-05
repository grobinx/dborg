import React from 'react';
import { styled } from '@mui/material';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import clsx from '@renderer/utils/clsx';

interface SliderProps {
    value: number;
    min: number;
    max: number;
    step: number;
    scale?: boolean | number;
    legend?: string[];
    disabled?: boolean;
    onChange?: (value: number) => void;
}

const StyledSlider = styled('div', {
    name: "Slider",
    slot: "root",
})(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: "0.5em",
    width: '100%',
    height: '100%',
    padding: '0 0 0 0.5em',
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
}));

const StyledSliderProgress = styled('div', {
    name: "Slider",
    slot: "progress",
})<{ progress: number }>(({ theme, progress }) => ({
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: `${progress}%`,
    height: '0.4em',
    backgroundColor: theme.palette.primary.main,
    borderRadius: '2px',
    transition: 'width 0.1s ease',
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
    boxShadow: theme.shadows[2],
    transition: 'left 0.1s ease, transform 0.1s ease',
    '&:hover': {
        transform: 'translateY(-50%) scale(1.1)',
    },
    '&:active': {
        transform: 'translateY(-50%) scale(1.2)',
    }
}));

const StyledBaseSliderLegend = styled('div', {
    name: "Slider",
    slot: "legend",
})(({ theme }) => ({
    minWidth: 'max-content',
    fontSize: theme.typography.body2.fontSize,
    color: theme.palette.text.primary,
    width: '52px',
    textAlign: 'center',
    backgroundColor: theme.palette.background.paper,
    borderRadius: '3px',
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

export const Slider: React.FC<SliderProps> = React.memo(({
    value,
    min: initMin = 0,
    max: initMax = 100,
    step = 1,
    scale = 10,
    legend,
    disabled,
    onChange
}) => {
    const decorator = useInputDecorator();
    const sliderRef = React.useRef<HTMLDivElement>(null);
    const isDragging = React.useRef(false);

    // Obsługa legend w komponencie slidera
    const { min, max, maxLength, displayValue, currentValue } = React.useMemo(() => {
        const hasLabels = legend && legend.length > 0;
        const calculatedMin = hasLabels ? 0 : initMin;
        const calculatedMax = hasLabels ? legend.length - 1 : initMax;
        const calculatedMaxLength = hasLabels
            ? legend.reduce((maxLen, label) => Math.max(maxLen, String(label).length), 0)
            : String(calculatedMax).length;

        const safeValue = Math.min(Math.max(value ?? calculatedMin, calculatedMin), calculatedMax);
        const calculatedDisplayValue = hasLabels
            ? legend[safeValue] || legend[0]
            : safeValue;

        if (value !== safeValue) {
            onChange?.(safeValue);
        }

        return {
            min: calculatedMin,
            max: calculatedMax,
            maxLength: calculatedMaxLength,
            displayValue: calculatedDisplayValue,
            currentValue: safeValue
        };
    }, [legend, initMin, initMax, value]);

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
                onFocus={() => decorator?.setFocused(true)}
                onBlur={() => decorator?.setFocused(false)}
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
                    `length-${maxLength}`
                )}
            >
                {displayValue}
            </StyledBaseSliderLegend>
        </StyledSlider>
    );
});

Slider.displayName = 'Slider';