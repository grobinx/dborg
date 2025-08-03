import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { styled, useTheme } from '@mui/material';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { validateMaxValue, validateMinValue } from './base/useValidation';
import { Adornment, BaseTextField } from './base/BaseTextField';

interface NumberFieldProps extends BaseInputProps<number> {
    placeholder?: FormattedContentItem;
    max?: number;
    min?: number;
    step?: number;
    adornments?: React.ReactNode;
}

const StyledBaseTextFieldNumberStepper = styled('button', {
    name: "TextField",
    slot: "numberStepper",
})(() => ({
}));

export const NumberField: React.FC<NumberFieldProps> = (props) => {
    const {
        value,
        max,
        min,
        step,
        onChange,
        size,
        ...other
    } = props;

    const theme = useTheme();
    const decorator = useInputDecorator();
    const valueRef = React.useRef(value); // Referencja do aktualnej wartości
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

    // Aktualizuj referencję za każdym razem, gdy `value` się zmienia
    React.useEffect(() => {
        valueRef.current = value;
    }, [value]);

    React.useEffect(() => {
        if (decorator) {
            const restrictions: React.ReactNode[] = [];
            if (min !== undefined) {
                restrictions.push(`≥${min}`);
            }
            if (max !== undefined) {
                restrictions.push(`≤${max}`);
            }
            if (restrictions.length) {
                decorator.setRestrictions(restrictions);
            } else {
                decorator.setRestrictions(undefined);
            }
        }
    }, [decorator, min, max]);

    const handleIncrement = (e) => {
        const newValue = Math.min((valueRef.current ?? 0) + (step ?? 1), max ?? Infinity);
        onChange?.(e, newValue);
    };

    const handleDecrement = (e) => {
        const newValue = Math.max((valueRef.current ?? 0) - (step ?? 1), min ?? -Infinity);
        onChange?.(e, newValue);
    };

    const startRepeat = (callback) => {
        callback();
        // Uruchom timeout dla pierwszego kliknięcia
        const timeoutId = setTimeout(() => {
            callback(); // Wywołaj funkcję po opóźnieniu
            const intervalId = setInterval(callback, 100); // Powtarzaj co 100ms
            timeoutRef.current = null; // Usuń timeout
            intervalRef.current = intervalId; // Zapisz ID interwału
        }, 750); // Opóźnienie 750ms

        timeoutRef.current = timeoutId; // Zapisz ID timeoutu
    };

    const stopRepeat = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current); // Zatrzymaj timeout, jeśli istnieje
            timeoutRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current); // Zatrzymaj interwał, jeśli istnieje
            intervalRef.current = null;
        }
    };

    return (
        <BaseTextField
            value={value}
            size={size}
            inputProps={{
                max,
                min,
                step,
                type: 'number',
            }}
            validations={[
                (value: any) => validateMinValue(value, min),
                (value: any) => validateMaxValue(value, max),
            ]}
            onChange={(e, newValue) => onChange?.(e, newValue)}
            inputAdornments={[
                <Adornment key="stepper" position="input" className="type-number">
                    <StyledBaseTextFieldNumberStepper
                        key="increment"
                        onMouseDown={(e) => {
                            e.preventDefault(); // Zapobiega utracie focusu
                            const intervalId = startRepeat(() => handleIncrement(e));
                            e.currentTarget.dataset.intervalId = String(intervalId); // Przechowaj ID interwału
                        }}
                        onMouseUp={() => {
                            stopRepeat(); // Zatrzymaj interwał
                        }}
                        onMouseLeave={() => {
                            stopRepeat(); // Zatrzymaj interwał, gdy kursor opuści przycisk
                        }}
                    >
                        <theme.icons.ExpandLess />
                    </StyledBaseTextFieldNumberStepper>
                    <StyledBaseTextFieldNumberStepper
                        key="decrement"
                        onMouseDown={(e) => {
                            e.preventDefault(); // Zapobiega utracie focusu
                            const intervalId = startRepeat(() => handleDecrement(e));
                            e.currentTarget.dataset.intervalId = String(intervalId); // Przechowaj ID interwału
                        }}
                        onMouseUp={() => {
                            stopRepeat(); // Zatrzymaj interwał
                        }}
                        onMouseLeave={() => {
                            stopRepeat(); // Zatrzymaj interwał, gdy kursor opuści przycisk
                        }}
                    >
                        <theme.icons.ExpandMore />
                    </StyledBaseTextFieldNumberStepper>
                </Adornment>,
            ]}
            {...other}
        />
    );
};

