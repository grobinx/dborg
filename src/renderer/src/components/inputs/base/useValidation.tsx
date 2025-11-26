import { FormattedContent } from "../../useful/FormattedText";
import { useInputDecorator } from "../decorators/InputDecoratorContext";
import React from "react";

export function useValidation<T>(
    value: T,
    disabled: boolean = false,
    validations: (((value: any) => boolean | FormattedContent) | undefined)[],
    onValid?: () => void,
    changedDelay: number = 500,
): [boolean | FormattedContent, ((valid: boolean | FormattedContent) => void) | undefined | null] {
    const decoration = useInputDecorator();
    const [invalid, setInvalid] = React.useState<boolean | FormattedContent>(false);
    const prevValueRef = React.useRef<T>(value);

    React.useEffect(() => {
        if (disabled || !validations || validations.length === 0) {
            setInvalid(undefined);
            return;
        }

        const timeoutId = setTimeout(() => {
            const invalid = validations.filter(Boolean).some((validate) => {
                const result = validate!(value);
                if (typeof result === "boolean") {
                    if (!result) {
                        setInvalid("Nieprawidłowa wartość");
                        return true;
                    }
                } else if (result) {
                    setInvalid(result);
                    return true;
                }
                return false;
            });

            if (!invalid && prevValueRef.current !== value) {
                setInvalid(undefined);
                onValid?.();
            }
            prevValueRef.current = value;
        }, changedDelay);

        return () => clearTimeout(timeoutId);
    }, [value, disabled, validations, onValid]);

    React.useEffect(() => {
        if (decoration) {
            decoration.setInvalid(invalid);
        }
    }, [decoration, invalid]);

    return [invalid, setInvalid];
}

export const validateRequired = (value: any, required: boolean | undefined): boolean | FormattedContent => {
    if (required && (value === undefined || value === null || value === "")) {
        return "To pole jest wymagane i nie może być puste";
    }
    return true;
};
export const validateMinLength = (value: any, minLength: number | undefined): boolean | FormattedContent => {
    if (minLength !== undefined && (value ?? "").length < minLength) {
        return `Wymagana minimalna długość to ${minLength} znaków`;
    }
    return true;
};
export const validateMaxLength = (value: any, maxLength: number | undefined): boolean | FormattedContent => {
    if (maxLength !== undefined && (value ?? "").length > maxLength) {
        return `Maksymalna długość to ${maxLength} znaków`;
    }
    return true;
};
export const validateMaxValue = (value: any, max: number | undefined): boolean | FormattedContent => {
    if (max !== undefined && value > max) {
        return `Maksymalna wartość to ${max}`;
    }
    return true;
};
export const validateMinValue = (value: any, min: number | undefined): boolean | FormattedContent => {
    if (min !== undefined && value < min) {
        return `Minimalna wartość to ${min}`;
    }
    return true;
};
export const validateMinRows = (value: any, minRows: number | undefined): boolean | FormattedContent => {
    if (minRows !== undefined && (value ?? "").split('\n').length < minRows) {
        return `Wymagana minimalna liczba wierszy to ${minRows}`;
    }
    return true;
};
export const validateMaxRows = (value: any, maxRows: number | undefined): boolean | FormattedContent => {
    if (maxRows !== undefined && (value ?? "").split('\n').length > maxRows) {
        return `Maksymalna liczba wierszy to ${maxRows}`;
    }
    return true;
};
export const validateEmail = (value: any): boolean | FormattedContent => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
        return "Nieprawidłowy format adresu e-mail";
    }
    return true;
}
export const validatePatternRequired = (value: any, mask: string): boolean | FormattedContent => {
    if (mask === value) {
        return "To pole jest wymagane i nie może być puste";
    }
    return true;
}
