import React, { InputHTMLAttributes } from 'react';
import { Collapse, styled } from '@mui/material';
import { BaseInputProps } from './BaseInputProps';
import { FormattedContentItem } from '@renderer/components/useful/FormattedText';
import clsx from '@renderer/utils/clsx';
import { useInputDecorator } from '../decorators/InputDecoratorContext';
import { useValidation, validateRequired } from './useValidation';

interface BaseInputFieldProps<T> extends BaseInputProps<T> {
    /**
     * Field type, not necessarily the same as HTML input type, but can be used for styling
     * e.g. 'text', 'number', 'password', 'email', etc.
     */
    type?: string;
    placeholder?: FormattedContentItem;
    inputAdornments?: React.ReactNode;
    adornments?: React.ReactNode;
    validations?: (((value: T) => boolean | FormattedContentItem) | undefined)[];
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    /**
     * Komponent, który zastępuje w miejscu inputa.
     * Może być użyty do renderowania niestandardowych pól wejściowych, takich jak przyciski, suwaki itp.
     * Jeśli jest podany, html input zostanie ukryty i nie będzie renderowany. 
     */
    input?: React.ReactNode;
    onConvertToValue?: (value: string) => T;
    onConvertToInput?: (value: T | undefined) => string;
}

const StyledBaseInputField = styled('div', {
    name: "InputField",
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

const StyledBaseInputFieldCustomInput = styled('div', {
    name: "InputField",
    slot: "customInput",
})<StyledInputProps>(({ width }) => ({
    flexGrow: 1,
    minWidth: 0, // Pozwala na zmniejszenie się inputa
    order: 10,
    width: width || "100%",
}));

const StyledBaseInputFieldInput = styled('input', {
    name: "InputField",
    slot: "input",
    shouldForwardProp: (prop) => prop !== 'width',
})<StyledInputProps>(({ width }) => ({
    flexGrow: 1,
    minWidth: 0, // Pozwala na zmniejszenie się inputa
    width: width || "100%",
}));

const StyledBaseInputFieldAdornment = styled('div', {
    name: "InputField",
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
    fullWidth?: boolean;
    style?: React.CSSProperties;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const Adornment: React.FC<AdornmentProps> = (props: AdornmentProps) => {
    const { children, position = 'start', className, ref, fullWidth, style, onClick } = props;
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
        <StyledBaseInputFieldAdornment
            className={clsx(
                "InputField-adornment",
                `position-${orderClass}`,
                className
            )}
            ref={ref}
            sx={{
                flex: fullWidth ? 1 : 'unset',
                order,
            }}
            style={style}
            onClick={onClick}
        >
            {children}
        </StyledBaseInputFieldAdornment>
    );
}

const StyledBaseInputFieldPlaceholder = styled('div', {
    name: "InputField",
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

export const BaseInputField = <T,>(props: BaseInputFieldProps<T>) => {
    const {
        type,
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
        input,
        ref,
        inputRef,
        onKeyDown,
        onKeyUp,
    } = props;

    const textInputRef = React.useRef<HTMLInputElement>(null);
    const [inputWidth, setInputWidth] = React.useState<number>(0);
    const [inputLeft, setInputLeft] = React.useState<number>(0);
    const decorator = useInputDecorator();
    const [focused, setFocused] = React.useState(false);

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
        focused && "focused",
        `type-${type ?? inputProps?.type ?? 'text'}`,
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
            decorator.setType(type ?? inputProps?.type ?? 'text');
        }
    }, [decorator, type, inputProps?.type]);

    return (
        <StyledBaseInputField
            className={clsx(
                "InputField-root",
                classes,
                className,
            )}
            ref={ref}
            onMouseDown={() => {
                textInputRef.current?.focus();
            }}
            sx={{ width }}
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
        >
            {adornments}
            {inputAdornments}
            {(currentValue === undefined || currentValue === "") && placeholder && !disabled && (
                <StyledBaseInputFieldPlaceholder
                    className={clsx(
                        "InputField-placeholder",
                        classes,
                    )}
                    sx={{
                        width: inputWidth ? `${inputWidth}px` : 'auto',
                        left: inputLeft,
                    }}
                >
                    {placeholder}
                </StyledBaseInputFieldPlaceholder>
            )}
            {input && (
                <StyledBaseInputFieldCustomInput
                    className={clsx(
                        "InputField-customInput",
                        classes,
                    )}
                >
                    {input}
                </StyledBaseInputFieldCustomInput>
            )}
            <StyledBaseInputFieldInput
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
                    "InputField-input",
                    classes,
                )}
                value={typeof onConvertToInput === 'function' ? onConvertToInput(currentValue) : String(currentValue)}
                onChange={(e) => onChange?.(typeof onConvertToValue === 'function' ? onConvertToValue(e.target.value) : e.target.value as T)}
                disabled={disabled}
                required={required}
                onFocus={() => {
                    onFocus?.();
                    setFocused(true);
                    decorator?.setFocused(true);
                }}
                onBlur={() => {
                    onBlur?.();
                    setFocused(false);
                    decorator?.setFocused(false);
                }}
                onClick={onClick}
                width={width}
                hidden={!!input}
                {...inputProps}
            />
        </StyledBaseInputField>
    )
}

