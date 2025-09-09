import React, { InputHTMLAttributes } from 'react';
import { styled } from '@mui/material';
import { BaseInputProps } from './BaseInputProps';
import { FormattedContentItem } from '../../useful/FormattedText';
import clsx from '../../../utils/clsx';
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
    autoCollapse?: boolean;
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
    position?: 'start' | 'end' | "input";
    ref?: React.Ref<HTMLDivElement>;
    fullWidth?: boolean;
    style?: React.CSSProperties;
    onClick?: React.MouseEventHandler<HTMLDivElement>;
}

export const Adornment: React.FC<AdornmentProps> = (props: AdornmentProps) => {
    const { children, position = 'start', className, ref, fullWidth, style, onClick } = props;

    return (
        <StyledBaseInputFieldAdornment
            className={clsx(
                "InputField-adornment",
                `position-${position}`,
                className
            )}
            ref={ref}
            sx={{
                flex: fullWidth ? 1 : 'unset',
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
        autoCollapse,
        color = "main",
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
    } = props;

    const textInputRef = React.useRef<HTMLInputElement>(null);
    const customInputRef = React.useRef<HTMLDivElement>(null);
    const [inputWidth, setInputWidth] = React.useState<number>(0);
    const [inputLeft, setInputLeft] = React.useState<number>(0);
    const decorator = useInputDecorator();
    const [focused, setFocused] = React.useState<boolean | undefined>(undefined);
    const [hover, setHover] = React.useState<boolean>(false);

    const currentValue = value ?? defaultValue;
    const [invalid] = useValidation(
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
        hover && "hover",
        autoCollapse && "auto-collapse",
    );

    const startAdornments = React.Children.toArray(adornments).filter((child) => {
        if (React.isValidElement(child) && child.type === Adornment) {
            const props = child.props as AdornmentProps;
            const position = props.position || 'start';
            return position === 'start';
        }
        return true;
    });

    const endAdornments = React.Children.toArray(adornments).filter((child) => {
        if (React.isValidElement(child) && child.type === Adornment) {
            const props = child.props as AdornmentProps;
            const position = props.position || 'start';
            return position === 'end';
        }
        return false;
    });

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
                if (!input && !disabled) { // ✅ Already handled
                    textInputRef.current?.focus();
                }
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            sx={{ width }}
        >
            {startAdornments}
            {(currentValue === undefined || currentValue === null || currentValue === "") && placeholder && !disabled && !input && (
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
                    ref={customInputRef}
                    className={clsx(
                        "InputField-customInput",
                        classes,
                    )}
                    onFocus={!disabled ? () => {
                        onFocus?.();
                        setFocused(true);
                        decorator?.setFocused(true);
                    } : undefined}
                    onBlur={!disabled ? () => {
                        onBlur?.();
                        setFocused(false);
                        decorator?.setFocused(false);
                    } : undefined}
                    onKeyDown={!disabled ? inputProps?.onKeyDown : undefined}
                    onKeyUp={!disabled ? inputProps?.onKeyUp : undefined}
                    onMouseDown={!disabled ? (e) => {
                        inputProps?.onMouseDown?.(e);
                    } : undefined}
                    onMouseUp={!disabled ? (e) => {
                        inputProps?.onClick?.(e as any);
                        inputProps?.onMouseUp?.(e);
                        onClick?.();
                    } : undefined}
                    onClick={undefined}
                    tabIndex={disabled ? -1 : 0}
                    aria-disabled={disabled}
                >
                    {input}
                </StyledBaseInputFieldCustomInput>
            )
            }
            <StyledBaseInputFieldInput
                {...inputProps}
                type={!!input ? "hidden" : inputProps?.type ?? "text"}
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
                value={typeof onConvertToInput === 'function' ? (onConvertToInput(currentValue) ?? "") : String(currentValue ?? "")}
                onChange={(e) => onChange?.(typeof onConvertToValue === 'function' ? onConvertToValue(e.target.value) : e.target.value as T)}
                disabled={disabled}  // ✅ Already handled
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
            />
            {inputAdornments}
            {endAdornments}
        </StyledBaseInputField >
    )
}

