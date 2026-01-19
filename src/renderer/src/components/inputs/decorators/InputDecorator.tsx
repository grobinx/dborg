import { Alert, Popper, styled, SxProps, useTheme } from "@mui/material";
import clsx from "../../../utils/clsx";
import { BaseInputProps } from "../base/BaseInputProps";
import { InputDecoratorContext, InputDecoratorContextType } from "./InputDecoratorContext";
import React from "react";
import { useVisibleState } from "../../../hooks/useVisibleState";
import { FormattedContent, FormattedContentItem, FormattedText } from "@renderer/components/useful/FormattedText";
import { Adornment } from "../base/BaseInputField";

/**
 * Wspólny zestaw właściwości dla komponentów wejściowych
 * Używany do definiowania podstawowych właściwości wejściowych, takich jak identyfikator, wartość, kolor, rozmiar itp.
 * @interface InputProps
 */
export interface InputDecoratorProps {
    children?: React.ReactElement<BaseInputProps>;
    id?: string;
    className?: string;
    /**
     * Czy element jest zaznaczony
     * Zostanie ustawiona odpowiednia klasa CSS "selected"
     * @default false
     */
    selected?: boolean;
    /**
     * Czy widoczny ma być opis ograniczeń, jak np. "Wymagane", "Maksymalnie 100 znaków"
     * Można zdefiniować funkcję, która zwróci informację o ograniczeniach
     * @default true
     */
    restrictions?: FormattedContentItem[];
    /**
     * Etykieta elementu
     * @default undefined
     */
    label?: FormattedContentItem;
    /**
     * Opis elementu, wyświetlany pod elementem edycyjnym
     * Może być użyty do wyświetlenia dodatkowych informacji lub instrukcji
     * @default undefined
     */
    description?: FormattedContent;
    /**
     * Czy ma być widoczny wskaźnik zmiany wartości
     * Ustawiony na false usunie indicator z elementu
     * Zostanie ustawiona dodatkowa klasa CSS "changed" jeśli wartość została zmieniona, "default" jeśli wartość odpowiada domyślnej
     * @default true
     */
    indicator?: boolean;
    /**
     * Szerokość elementu
     * Może być podana jako liczba (w pikselach) lub jako string
     * Przykłady: 200, '100%', '50px', 'auto'
     * Jeśli nie zostanie podana, szerokość będzie ustawiona na 100%
     */
    width?: string | number;
    /**
     * Funkcja wywoływana po kliknięciu w dowolną część pola
     */
    onClick?: () => void;
    /** 
     * Czy pokazywać komunikat o błędzie pod polem, jeśli występuje błąd walidacji
     * @default true
     */
    showValidity?: boolean;
    /**
     * Czy wyłączyć miganie wskaźnika braku aktywności
     * @default false
     */
    disableBlink?: boolean;

    sx?: SxProps;
    ref?: React.Ref<HTMLDivElement>;
}

const StyledInputDecorator = styled('div', {
    name: "InputDecorator",
    slot: "root",
    shouldForwardProp: (prop) => prop !== "width",
})<{ width?: number | string }>((props) => ({
    display: "flex",
    flexDirection: "row",
    width: props.width ?? "100%",
}));

const StyledInputDecoratorIndicator = styled('div', {
    name: "InputDecorator",
    slot: "indicator",
})(() => ({
    display: "flex",
}));

const StyledInputDecoratorContainer = styled('div', {
    name: "InputDecorator",
    slot: "container",
})(() => ({
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    minWidth: 0, // Pozwala na zmniejszenie się kontenera
    width: "100%", // Ogranicza szerokość do rodzica
}));

const StyledInputDecoratorLabel = styled('div', {
    name: "InputDecorator",
    slot: "label",
})(({ theme }) => ({
    ...theme.typography.label,
    display: "flex",
    flexDirection: "row",
    flexGrow: 1,
    minWidth: 0, // Pozwala na zmniejszenie się kontenera
    width: "100%", // Ogranicza szerokość do rodzica
}));

const StyledInputDecoratorLabelText = styled('label', {
    name: "InputDecorator",
    slot: "labelText",
})(({ /*theme*/ }) => ({
    flexGrow: 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
}));

const StyledInputDecoratorValidity = styled(Popper, {
    name: "InputDecorator",
    slot: "validity",
})(({ /*theme*/ }) => ({
}));

interface InputDecoratorLabelProps {
    className?: string;
    children?: React.ReactNode;
    label?: FormattedContentItem;
    restrictions?: FormattedContentItem[];
}

export const InputDecoratorLabel: React.FC<InputDecoratorLabelProps> = (props: InputDecoratorLabelProps) => {
    const { children, className, label, restrictions } = props;
    return (
        <StyledInputDecoratorLabel
            className={clsx(
                "InputDecorator-label",
                className
            )}
        >
            {children}
            <StyledInputDecoratorLabelText
                className={clsx(
                    "InputDecorator-labelText",
                    className
                )}
            >
                {label}
            </StyledInputDecoratorLabelText>
            {restrictions && (
                <StyledInputDecoratorRestrictions
                    className={clsx(
                        "InputDecorator-restrictions",
                        className
                    )}
                >
                    {restrictions.map((restriction, index) => {
                        return (
                            <Restriction
                                key={`restriction-${index}`}
                                className={clsx(
                                    "InputDecorator-restriction",
                                    className
                                )}
                            >
                                <FormattedText text={restriction} />
                            </Restriction>
                        );
                    })}
                </StyledInputDecoratorRestrictions>
            )}
        </StyledInputDecoratorLabel>
    );
}

const StyledInputDecoratorRestrictions = styled('div', {
    name: "InputDecorator",
    slot: "restrictions",
})(({ theme }) => ({
    ...theme.typography.label,
    display: "flex",
    flexDirection: "row",
}));

const StyledInputDecoratorRestriction = styled('span', {
    name: "InputDecorator",
    slot: "restriction",
})(({ /*theme*/ }) => ({
    whiteSpace: "nowrap",
}));

interface RestrictionProps {
    className?: string;
    children?: React.ReactNode;
}

export const Restriction: React.FC<RestrictionProps> = (props: RestrictionProps) => {
    const { children, className } = props;
    return (
        <StyledInputDecoratorRestriction
            className={clsx(
                "InputDecorator-restriction",
                className
            )}
        >
            {children}
        </StyledInputDecoratorRestriction>
    );
}

const StyledInputDecoratorDescription = styled('div', {
    name: "InputDecorator",
    slot: "description",
})(({ theme }) => ({
    ...theme.typography.description,
    display: "flex",
    flexDirection: "row",
    flexGrow: 1,
    minWidth: 0, // Pozwala na zmniejszenie się kontenera
    width: "100%", // Ogranicza szerokość do rodzica
}));

const StyledInputDecoratorInput = styled('div', {
    name: "InputDecorator",
    slot: "input",
})(() => ({
    display: "flex",
    flexDirection: "row",
    flexGrow: 1,
    minWidth: 0,
    width: "100%",
}));

export const InputDecorator = (props: InputDecoratorProps): React.ReactElement => {
    const {
        children,
        className,
        width = "100%",
        restrictions,
        label,
        onClick,
        description,
        indicator = true,
        selected = false,
        sx,
        showValidity = true,
        disableBlink = false,
        ref,
    } = props;

    const theme = useTheme();
    const [inputRestrictions, setInputRestrictions] = React.useState<FormattedContentItem[]>([]);
    const [invalid, setInvalid] = React.useState<FormattedContent>(undefined);
    const [visibleInputRef, isPopperVisible] = useVisibleState<HTMLDivElement>();
    const [focused, setFocused] = React.useState<boolean>(false);
    const [hover, setHover] = React.useState<boolean>(false);
    const [type, setType] = React.useState<string>("text");
    const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);
    const previouseValueRef = React.useRef<any>(null);
    const [wasCleared, setWasCleared] = React.useState<boolean>(false);

    // Idle-attention (blink after inactivity while focused)
    const [idleAttention, setIdleAttention] = React.useState(false);
    const lastActivityRef = React.useRef<number>(Date.now());
    const onTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const offTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const contextValue = React.useMemo<InputDecoratorContextType>(() => ({
        setRestrictions: (restrictions) => {
            setInputRestrictions(restrictions ?? []);
        },
        invalid: invalid,
        setInvalid: (invalid) => {
            if (typeof invalid === 'boolean') {
                setInvalid(invalid ? "Nieprawidłowa wartość" : undefined);
            } else {
                setInvalid(invalid);
            }
        },
        focused: focused,
        setFocused: (focused) => {
            setFocused(focused);
        },
        type: type,
        setType: (type) => {
            setType(type);
        },
    }), [invalid, focused]);

    // Pobieranie właściwości bez klonowania
    const { required, disabled, size, defaultValue, value, color } = React.useMemo(() => {
        if (React.isValidElement(children)) {
            return {
                required: children.props.required ?? false,
                disabled: children.props.disabled ?? false,
                size: children.props.size ?? "medium",
                defaultValue: children.props.defaultValue,
                value: children.props.value,
                color: children.props.color ?? "main",
            };
        }
        return {
            required: false,
            disabled: false,
            size: "medium",
            defaultValue: undefined,
            value: undefined,
            color: "main",
        };
    }, [children]);

    const clearIdleTimers = React.useCallback(() => {
        if (onTimerRef.current) { clearTimeout(onTimerRef.current); onTimerRef.current = null; }
        if (offTimerRef.current) { clearTimeout(offTimerRef.current); offTimerRef.current = null; }
    }, []);

    const scheduleIdleOff = React.useCallback(() => {
        const ATTENTION_MS = 2000;
        offTimerRef.current = setTimeout(() => {
            if (!focused || type === "search" || disableBlink) return;
            setIdleAttention(false);
            // restart cycle “from the beginning”
            lastActivityRef.current = Date.now();
            // schedule next idle on
            scheduleIdleOn();
        }, ATTENTION_MS);
    }, [focused, type, disableBlink]);

    const scheduleIdleOn = React.useCallback(() => {
        const IDLE_MS = 30000;
        const elapsed = Date.now() - lastActivityRef.current;
        const delay = Math.max(0, IDLE_MS - elapsed);
        onTimerRef.current = setTimeout(() => {
            if (!focused || type === "search" || disableBlink) return;
            // ensure no activity happened in the meantime
            if (Date.now() - lastActivityRef.current < IDLE_MS) return;
            setIdleAttention(true);
            scheduleIdleOff();
        }, delay);
    }, [focused, type, scheduleIdleOff, disableBlink]);

    // restart cycle on focus change
    React.useEffect(() => {
        clearIdleTimers();
        setIdleAttention(false);
        if (focused && type !== "search" && !disableBlink) {
            lastActivityRef.current = Date.now();
            scheduleIdleOn();
        }
        return () => clearIdleTimers();
    }, [focused, type, clearIdleTimers, scheduleIdleOn, disableBlink]);

    // restart cycle on value change (activity)
    React.useEffect(() => {
        lastActivityRef.current = Date.now();
        if (!focused || type === "search" || disableBlink) return;
        clearIdleTimers();
        setIdleAttention(false);
        scheduleIdleOn();
    }, [type, value, focused, clearIdleTimers, scheduleIdleOn, disableBlink]);

    React.useEffect(() => {
        if (previouseValueRef.current && (value === "" || value === null || value === undefined)) {
            setWasCleared(true);
        } else {
            setWasCleared(false);
        }
        previouseValueRef.current = value;
    }, [value]);

    const [previousValue] = React.useState(value);

    const classes = clsx(
        `size-${size}`,
        disabled && "disabled",
        required && "required",
        invalid && "invalid",
        selected && "selected",
        focused && "focused",
        hover && "hover",
        idleAttention && "idle-attention",
        `type-${type}`,
        `color-${color}`,
        { bare: !indicator && !label && !restrictions && !description },
    );

    const changed = !disabled && JSON.stringify(previousValue) !== JSON.stringify(value);
    const isDefaultValue = JSON.stringify(value ?? defaultValue) === JSON.stringify(defaultValue);

    // Przygotuj adornments poza memo
    const typeAdornments = React.useMemo(() => {
        const { TextField, NumberField, EmailField, Search } = theme.icons;

        switch (type) {
            // case "text":
            //     return <Adornment key="text" position="end" onClick={() => inputRef.current?.focus()}><TextField /></Adornment>;
            // case "number":
            //     return <Adornment key="number" position="end" onClick={() => inputRef.current?.focus()}><NumberField /></Adornment>;
            case "email":
                return <Adornment key="email" position="end" onClick={() => inputRef.current?.focus()}><EmailField /></Adornment>;
            case "search":
                return <Adornment key="search" position="end" onClick={() => inputRef.current?.focus()}><Search /></Adornment>;
            default:
                return undefined;
        }
    }, [type, theme.icons]);

    const clonedChildren = React.useMemo(() => {
        if (!React.isValidElement(children)) {
            return children;
        }

        if ('adornments' in children.props || typeAdornments) {
            const childProps = children.props as BaseInputProps & { adornments?: React.ReactNode };

            return React.cloneElement<typeof childProps>(children, {
                ...children.props,
                adornments: [
                    ...React.Children.toArray(childProps.adornments || []),
                    typeAdornments,
                ].filter(Boolean),
                inputRef: (ref) => {
                    if (typeof childProps.inputRef === 'function') {
                        childProps.inputRef(ref);
                    }
                    else if (childProps.inputRef) {
                        childProps.inputRef.current = ref;
                    }
                    inputRef.current = ref;
                }
            });
        }

        return children;
    }, [children, typeAdornments]); // Teraz zależy tylko od stabilnych wartości

    const handleMouseEnter = React.useCallback(() => setHover(true), []);
    const handleMouseLeave = React.useCallback(() => setHover(false), []);
    const handleClick = React.useCallback(() => onClick?.(), [onClick]);

    return (
        <InputDecoratorContext.Provider value={contextValue}>
            <StyledInputDecorator
                ref={ref}
                className={clsx(
                    "InputDecorator-root",
                    classes,
                    className
                )}
                width={width}
                onMouseDown={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                sx={sx}
                data-focus-container={true}
            >
                {indicator && (
                    <StyledInputDecoratorIndicator
                        className={clsx(
                            "InputDecorator-indicator",
                            changed && "changed",
                            isDefaultValue && "default",
                            classes
                        )}
                    />)
                }
                <StyledInputDecoratorContainer
                    className={clsx(
                        "InputDecorator-container",
                        classes,
                    )}
                >
                    {label && (
                        <InputDecoratorLabel
                            className={clsx(
                                classes,
                            )}
                            label={label}
                            restrictions={[...(restrictions ?? []), ...(inputRestrictions ?? [])]}
                        />
                    )}
                    <StyledInputDecoratorInput
                        className={clsx(
                            "InputDecorator-input",
                            classes,
                        )}
                        ref={visibleInputRef}
                    >
                        {clonedChildren}
                    </StyledInputDecoratorInput>
                    {description && (
                        <StyledInputDecoratorDescription
                            className={clsx(
                                "InputDecorator-description",
                                classes,
                            )}
                        >
                            {description}
                        </StyledInputDecoratorDescription>
                    )}
                    {showValidity !== false && (
                        <StyledInputDecoratorValidity
                            disablePortal={true}
                            open={!!invalid && isPopperVisible && wasCleared}
                            anchorEl={visibleInputRef.current || undefined}
                            placement="bottom-start"
                            sx={{
                                width: visibleInputRef.current ? `${visibleInputRef.current.offsetWidth}px` : undefined,
                                minWidth: 200,
                            }}
                            className={clsx(
                                "InputDecorator-validity",
                                classes,
                            )}
                        >
                            <Alert
                                severity="error"
                            >
                                {!!invalid && invalid}
                            </Alert>
                        </StyledInputDecoratorValidity>
                    )}
                </StyledInputDecoratorContainer>
            </StyledInputDecorator>
        </InputDecoratorContext.Provider>
    );
};

InputDecorator.displayName = "InputDecorator";
