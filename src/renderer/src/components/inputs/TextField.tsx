import React from 'react';
import { InputProps } from './base/InputControl';
import { styled } from '@mui/material';
import clsx from '../../utils/clsx';
import { useInputDecorator } from './decorators/InputDecoratorContext';
import { FormattedContentItem } from '../useful/FormattedText';

interface TextFieldProps extends InputProps {
    placeholder?: FormattedContentItem;
    maxLength?: number;
    minLength?: number;
    adornments?: React.ReactNode;
}

const StyledTextField = styled('div', {
    name: "TextField",
    slot: "root",
})(() => ({
    display: "flex",
    flexDirection: "row",
    flexGrow: 1,
    position: "relative",
    minWidth: 0, // Pozwala na zmniejszenie się kontenera
    width: "100%", // Ogranicza szerokość do rodzica
}));

const StyledTextFieldInput = styled('input', {
    name: "TextField",
    slot: "input",
})(() => ({
    flexGrow: 1,
    minWidth: 0, // Pozwala na zmniejszenie się inputa
    order: 10,
}));

const StyledTextFieldAdornment = styled('div', {
    name: "TextField",
    slot: "adornment",
})(({ /*theme*/ }) => ({
    display: "flex",
    flexDirection: "row",
}));

interface AdornmentProps {
    className?: string;
    children?: React.ReactNode;
    /**
     * Pozycja elementu w adnotacji
     * Może być 'start' (domyślnie) lub 'end' dla wyrównania do lewej lub prawej strony
     * Można również podać liczbę, która określa kolejność (order) elementu
     * Kolejność <= 10 będzie na początku, a > 10 na końcu
     */
    position?: 'start' | 'end' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;
}

export const Adornment: React.FC<AdornmentProps> = (props: AdornmentProps) => {
    const { children, position = 'start', className } = props;
    return (
        <StyledTextFieldAdornment
            className={clsx(
                "TextField-adornment",
                (position === 'start' || (typeof position === 'number' && position <= 10)) ? 'start' : 'end',
                className
            )}
            sx={{
                order: typeof position === 'number' ? position : (position === 'start' ? 0 : 20),
            }}
        >
            {children}
        </StyledTextFieldAdornment>
    );
}

const StyledPlaceholder = styled('div', {
    name: "TextField",
    slot: "placeholder",
})(({ /*theme*/ }) => ({
    position: "absolute",
    top: "50%", // Wyśrodkowanie w pionie
    left: "8px", // Wyśrodkowanie w poziomie
    transform: "translateY(-50%)", // Przesunięcie o połowę wysokości
    pointerEvents: "none", // Zapobiega interakcji z placeholderem
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    minWidth: 0,
}));

export const TextField: React.FC<TextFieldProps> = (props) => {
    const {
        id,
        className,
        maxLength,
        minLength,
        size = "medium",
        value,
        onChange,
        disabled = false,
        required = false,
        width = "100%",
        adornments,
        placeholder,
        color = "primary",
        onValidate,
        onFocus,
        onBlur,
        onClick,
        defaultValue,
        ref,
        inputRef,
    } = props;

    const textInputRef = React.useRef<HTMLInputElement>(null);
    const [inputWidth, setInputWidth] = React.useState<number>(0);
    const [inputLeft, setInputLeft] = React.useState<number>(0);
    const inputDecorationContext = useInputDecorator();

    const currentValue = value ?? defaultValue;

    const classes = clsx(
        `size-${size}`,
        disabled && "disabled",
        required && "required",
        `color-${color}`,
        inputDecorationContext && inputDecorationContext.invalid && "invalid",
    );

    React.useEffect(() => {
        if (textInputRef.current) {
            const computedStyle = window.getComputedStyle(textInputRef.current);
            const paddingLeft = parseFloat(computedStyle.paddingLeft);
            const paddingRight = parseFloat(computedStyle.paddingRight);
            const borderLeft = Math.ceil(parseFloat(computedStyle.borderLeftWidth));
            const borderRight = Math.ceil(parseFloat(computedStyle.borderRightWidth));

            setInputWidth(textInputRef.current.offsetWidth - paddingLeft - paddingRight - borderLeft - borderRight);
            setInputLeft(textInputRef.current.offsetLeft + paddingLeft + borderLeft);
        }
    }, [width, adornments]);

    React.useEffect(() => {
        if (!inputDecorationContext) return;

        if (disabled) {
            inputDecorationContext.setInvalid(undefined);
            return;
        }

        const timeoutId = setTimeout(() => {
            let valid = true;
            const isEmpty = currentValue === undefined || currentValue === null || currentValue === "";

            if (required && isEmpty) {
                valid = false;
                inputDecorationContext.setInvalid("To pole jest wymagane i nie może być puste");
            }

            if (valid && minLength && currentValue.length < minLength) {
                valid = false;
                inputDecorationContext.setInvalid(`Wymagana minimalna długość to ${minLength} znaków`);
            }
            if (valid && maxLength && currentValue.length > maxLength) {
                valid = false;
                inputDecorationContext.setInvalid(`Maksymalna długość to ${maxLength} znaków`);
            }

            if (valid && typeof onValidate === "function") {
                const result = onValidate(currentValue);
                if (result === false) {
                    valid = false;
                    inputDecorationContext.setInvalid("Nieprawidłowa wartość");
                } else if (result) {
                    valid = false;
                    inputDecorationContext.setInvalid(result);
                } else {
                    inputDecorationContext.setInvalid(undefined);
                }
            }

            if (valid) {
                inputDecorationContext.setInvalid(undefined);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [currentValue, required, disabled, onValidate]);

    if (inputDecorationContext && maxLength) {
        inputDecorationContext.setRestrictions(`${(currentValue ?? "").length}/${maxLength}`);
    }

    return (
        <StyledTextField
            className={clsx(
                "TextField-root",
                classes,
                className,
            )}
            ref={ref}
        >
            {adornments}
            {(!currentValue || currentValue === "") && placeholder && !disabled && (
                <StyledPlaceholder
                    className={clsx(
                        "TextField-placeholder",
                        classes,
                    )}
                    sx={{
                        width: inputWidth ? `${inputWidth}px` : 'auto',
                        left: inputLeft,
                    }}
                >
                    {placeholder}
                </StyledPlaceholder>
            )}
            <StyledTextFieldInput
                id={id}
                ref={(ref) => {
                    textInputRef.current = ref;
                    if (inputRef && ref) {
                        inputRef.current = ref;
                    }
                }}
                className={clsx(
                    "TextField-input",
                    classes,
                )}
                type="text"
                maxLength={maxLength}
                minLength={minLength}
                value={currentValue}
                onChange={(e) => onChange?.(e, e.target.value)}
                disabled={disabled}
                required={required}
                onFocus={onFocus}
                onBlur={onBlur}
                onClick={onClick}
            />
        </StyledTextField>
    )
}

