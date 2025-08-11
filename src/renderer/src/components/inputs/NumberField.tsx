import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { styled, useTheme } from '@mui/material';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';
import { validateMaxValue, validateMinValue } from './base/useValidation';
import { Adornment, BaseInputField } from './base/BaseInputField';

interface NumberFieldProps extends BaseInputProps<number | undefined> {
    placeholder?: FormattedContentItem;
    max?: number;
    min?: number;
    step?: number;
    adornments?: React.ReactNode;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

const StyledBaseInputFieldNumberStepper = styled('button', {
    name: "InputField",
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
        inputProps,
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

    const handleIncrement = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const amount = e.shiftKey ? ((step ?? 1) * 10) : (step ?? 1);
        const newValue = Math.min((valueRef.current ?? 0) + amount, max ?? Infinity);
        onChange?.(newValue);
    };

    const handleDecrement = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const amount = e.shiftKey ? ((step ?? 1) * 10) : (step ?? 1);
        const newValue = Math.max((valueRef.current ?? 0) - amount, min ?? -Infinity);
        onChange?.(newValue);
    };

    const startRepeat = (callback: () => void) => {
        callback();
        // Uruchom timeout dla pierwszego kliknięcia
        const timeoutId = setTimeout(() => {
            callback(); // Wywołaj funkcję po opóźnieniu
            const intervalId = setInterval(callback, 50); // Powtarzaj co 100ms
            timeoutRef.current = null; // Usuń timeout
            intervalRef.current = intervalId; // Zapisz ID interwału
        }, 500); // Opóźnienie 500ms

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
        <BaseInputField
            value={value}
            inputProps={{
                max,
                min,
                step,
                type: 'number',
                ...inputProps,
            }}
            validations={[
                (value: any) => validateMinValue(value, min),
                (value: any) => validateMaxValue(value, max),
            ]}
            onConvertToValue={(value: string) => {
                const numValue = parseFloat(value);
                return isNaN(numValue) ? undefined : numValue;
            }}
            onConvertToInput={(value: number | undefined) => {
                return value !== undefined ? String(value) : '';
            }}
            onChange={(newValue) => onChange?.(newValue)}
            inputAdornments={[
                <Adornment key="stepper" position="input" className="type-number">
                    <StyledBaseInputFieldNumberStepper
                        key="increment"
                        className={"InputField-numberStepper"}
                        onMouseDown={(e) => {
                            e.preventDefault(); // Zapobiega utracie focusu
                            startRepeat(() => handleIncrement(e));
                        }}
                        onMouseUp={() => {
                            stopRepeat(); // Zatrzymaj interwał
                        }}
                        onMouseLeave={() => {
                            stopRepeat(); // Zatrzymaj interwał, gdy kursor opuści przycisk
                        }}
                    >
                        <span>▲</span>
                    </StyledBaseInputFieldNumberStepper>
                    <StyledBaseInputFieldNumberStepper
                        key="decrement"
                        className={"InputField-numberStepper"}
                        onMouseDown={(e) => {
                            e.preventDefault(); // Zapobiega utracie focusu
                            startRepeat(() => handleDecrement(e));
                        }}
                        onMouseUp={() => {
                            stopRepeat(); // Zatrzymaj interwał
                        }}
                        onMouseLeave={() => {
                            stopRepeat(); // Zatrzymaj interwał, gdy kursor opuści przycisk
                        }}
                    >
                       <span>▼</span>
                    </StyledBaseInputFieldNumberStepper>
                </Adornment>,
            ]}
            {...other}
        />
    );
};

NumberField.displayName = 'NumberField';
