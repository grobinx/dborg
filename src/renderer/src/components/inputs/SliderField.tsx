import React from 'react';
import { BaseInputProps } from './base/BaseInputProps';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { validateMaxValue, validateMinValue } from './base/useValidation';
import { BaseTextField } from './base/BaseTextField';
import { Range, Slider } from './Slider';

interface SliderFieldProps extends BaseInputProps<number | undefined> {
    max?: number;
    min?: number;
    step?: number;
    legend?: string[];
    /**
     * Czy pokazywać skalę lub ile wynosi maksymalna wartość by ją pokazać
     * Domyślnie 10 - jeśli różnica między min a max jest mniejsza lub równa 10, to pokaż skalę
     */
    scale?: boolean | number;
    adornments?: React.ReactNode;
}

interface RangeFieldProps extends BaseInputProps<[number, number] | undefined> {
    max?: number;
    min?: number;
    step?: number;
    legend?: string[];
    /**
     * Czy pokazywać skalę lub ile wynosi maksymalna wartość by ją pokazać
     * Domyślnie 10 - jeśli różnica między min a max jest mniejsza lub równa 10, to pokaż skalę
     */
    scale?: boolean | number;
    adornments?: React.ReactNode;
}

export const SliderField: React.FC<SliderFieldProps> = (props) => {
    const {
        value,
        max = 100,
        min = 0,
        step = 1,
        scale = 10,
        legend,
        onChange,
        disabled,
        ...other
    } = props;

    const decorator = useInputDecorator();

    // Uproszczona wersja - CustomSlider obsługuje legend
    const currentValue = value ?? min;

    // Ustawienie ograniczeń w dekoratorze
    React.useEffect(() => {
        if (decorator && (!legend || legend.length === 0)) {
            decorator.setRestrictions(`${min}-${max}`);
        } else if (decorator) {
            decorator.setRestrictions(undefined);
        }
    }, [decorator, min, max, legend]);

    return (
        <BaseTextField
            type="slider"
            value={currentValue}
            inputProps={{
                style: { display: 'none', pointerEvents: 'none' },
                type: 'range',
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
            //onChange={onChange}
            input={
                <Slider
                    value={currentValue}
                    min={min}
                    max={max}
                    step={step}
                    scale={scale}
                    legend={legend}
                    disabled={disabled}
                    onChange={onChange}
                />
            }
            {...other}
        />
    );
};

SliderField.displayName = 'SliderField';

export const RangeField: React.FC<RangeFieldProps> = (props) => {
    const {
        value,
        max = 100,
        min = 0,
        step = 1,
        scale = 10,
        legend,
        onChange,
        disabled,
        ...other
    } = props;

    const decorator = useInputDecorator();

    // Uproszczona wersja - CustomSlider obsługuje legend
    const currentValue = value ?? [min, max];

    // Ustawienie ograniczeń w dekoratorze
    React.useEffect(() => {
        if (decorator && (!legend || legend.length === 0)) {
            decorator.setRestrictions(`${min}-${max}`);
        } else if (decorator) {
            decorator.setRestrictions(undefined);
        }
    }, [decorator, min, max, legend]);

    return (
        <BaseTextField
            type="slider"
            value={currentValue}
            inputProps={{
                style: { display: 'none', pointerEvents: 'none' },
                type: 'range',
            }}
            validations={[
                (value: any) => validateMinValue(value, min),
                (value: any) => validateMaxValue(value, max),
            ]}
            onConvertToValue={(value: string) => {
                if (!value) return undefined;
                try {
                    const numValue = JSON.parse(value);
                    return isNaN(numValue) ? undefined : numValue;
                } catch {
                    return undefined;
                }
            }}
            onConvertToInput={(value: [number, number] | undefined) => {
                return value !== undefined ? JSON.stringify(value) : '';
            }}
            //onChange={onChange}
            input={
                <Range
                    value={currentValue}
                    min={min}
                    max={max}
                    step={step}
                    scale={scale}
                    legend={legend}
                    disabled={disabled}
                    onChange={onChange}
                />
            }
            {...other}
        />
    );
};

RangeField.displayName = 'RangeField';

