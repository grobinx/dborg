import React, { InputHTMLAttributes } from 'react';
import { styled } from '@mui/material';
import { BaseInputProps } from './BaseInputProps';
import { FormattedContentItem } from '@renderer/components/useful/FormattedText';
import clsx from '@renderer/utils/clsx';
import { useInputDecorator } from '../decorators/InputDecoratorContext';
import { useValidation, validateRequired } from './useValidation';

interface BaseTextFieldProps<T> extends BaseInputProps<T> {
    placeholder?: FormattedContentItem;
    inputAdornments?: React.ReactNode;
    adornments?: React.ReactNode;
    validations?: ((value: T) => boolean | FormattedContentItem)[];
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    onConvertToValue?: (value: string) => T;
    onConvertToInput?: (value: T | undefined) => string;
}

const StyledBaseTextField = styled('div', {
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

interface StyledInputProps extends InputHTMLAttributes<HTMLInputElement> {
    width?: string | number;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

const StyledBaseTextFieldInput = styled('input', {
    name: "TextField",
    slot: "input",
})<StyledInputProps>(({ width }) => ({
    flexGrow: 1,
    minWidth: 0, // Pozwala na zmniejszenie się inputa
    order: 10,
    width: width || "100%",
}));

const StyledBaseTextFieldAdornment = styled('div', {
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
    position?: 'start' | 'end' | 'input' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;
    ref?: React.Ref<HTMLDivElement>;
}

export const Adornment: React.FC<AdornmentProps> = (props: AdornmentProps) => {
    const { children, position = 'start', className, ref } = props;
    let order = 0;
    let orderClass = 'start';

    if (typeof position === 'number') {
        order = position;
        if (position > 10) {
            orderClass = 'end';
        }
    } else if (position === 'end') {
        order = 20;
        orderClass = 'end';
    } else if (position === 'input') {
        order = 11; 
        orderClass = 'input';
    }

    return (
        <StyledBaseTextFieldAdornment
            className={clsx(
                "TextField-adornment",
                `position-${orderClass}`,
                className
            )}
            ref={ref}
            sx={{
                order,
            }}
        >
            {children}
        </StyledBaseTextFieldAdornment>
    );
}

const StyledBaseTextFieldPlaceholder = styled('div', {
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

export const BaseTextField = <T,>(props: BaseTextFieldProps<T>) => {
    const {
        id,
        className,
        size = "medium",
        value,
        onChange,
        onConvertToValue,
        onConvertToInput,
        onChanged,
        changedDelay = 500,
        disabled = false,
        required = false,
        width = "100%",
        inputAdornments,
        adornments,
        placeholder,
        color = "primary",
        onValidate,
        onFocus,
        onBlur,
        onClick,
        defaultValue,
        validations,
        inputProps,
        ref,
        inputRef,
    } = props;

    const textInputRef = React.useRef<HTMLInputElement>(null);
    const [inputWidth, setInputWidth] = React.useState<number>(0);
    const [inputLeft, setInputLeft] = React.useState<number>(0);
    const decorator = useInputDecorator();

    const currentValue = value ?? defaultValue;
    const [invalid, setInvalid] = useValidation(
        currentValue, 
        disabled, 
        [
            (value: any) => validateRequired(value, required),
            ...(validations ?? []),
            (value: any) => onValidate?.(value) ?? true
        ], 
        () => {
            if (currentValue !== undefined) {
                onChanged?.(currentValue);
            }
        },
        changedDelay
    );

    const classes = clsx(
        `size-${size}`,
        disabled && "disabled",
        required && "required",
        `color-${color}`,
        invalid && "invalid",
        decorator?.focused && "focused",
        `type-${inputProps?.type || 'text'}`,
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
        if (decorator) {
            decorator.setType(inputProps?.type || 'text');
        }
    }, [decorator, inputProps?.type]);

    return (
        <StyledBaseTextField
            className={clsx(
                "TextField-root",
                classes,
                className,
            )}
            ref={ref}
            onMouseDown={() => {
                textInputRef.current?.focus();
            }}
        >
            {adornments}
            {inputAdornments}
            {(currentValue === undefined || currentValue === "") && placeholder && !disabled && (
                <StyledBaseTextFieldPlaceholder
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
                </StyledBaseTextFieldPlaceholder>
            )}
            <StyledBaseTextFieldInput
                id={id}
                ref={(ref) => {
                    textInputRef.current = ref;
                    if (inputRef && ref) {
                        if (typeof inputRef === 'object' && 'current' in inputRef) {
                            (inputRef as React.RefObject<HTMLInputElement>).current = ref;
                        } else if (typeof inputRef === 'function') {
                            inputRef(ref);
                        }
                    }
                }}
                className={clsx(
                    "TextField-input",
                    classes,
                )}
                value={typeof onConvertToInput === 'function' ? onConvertToInput(currentValue) : String(currentValue)}
                onChange={(e) => onChange?.(typeof onConvertToValue === 'function' ? onConvertToValue(e.target.value) : e.target.value as T)}
                disabled={disabled}
                required={required}
                onFocus={() => {
                    onFocus?.();
                    decorator?.setFocused(true);
                }}
                onBlur={() => {
                    onBlur?.();
                    decorator?.setFocused(false);
                }}
                onClick={onClick}
                width={width}
                {...inputProps}
            />
        </StyledBaseTextField>
    )
}

