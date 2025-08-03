import { Alert, Palette, Popper, styled } from "@mui/material";
import clsx from "../../../utils/clsx";
import { InputProps } from "../base/InputControl";
import { InputDecoratorContext, InputDecoratorContextType } from "./InputDecoratorContext";
import React from "react";
import { useVisibleState } from "../../../hooks/useVisibleState";
import { FormattedContent, FormattedContentItem } from "@renderer/components/useful/FormattedText";
import { PaletteColor, Size } from "../base/types";

/**
 * Wspólny zestaw właściwości dla komponentów wejściowych
 * Używany do definiowania podstawowych właściwości wejściowych, takich jak identyfikator, wartość, kolor, rozmiar itp.
 * @interface InputProps
 */
export interface InputDecoratorProps {
    children?: React.ReactElement<InputProps>;
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
    restrictions?: React.ReactNode;
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
    restrictions?: React.ReactNode;
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
                    {restrictions}
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
}));

export function InputDecorator(props: InputDecoratorProps): React.ReactElement {
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
    } = props;

    const [inputRestrictions, setInputRestrictions] = React.useState<React.ReactNode>(null);
    const [invalid, setInvalid] = React.useState<FormattedContent>(undefined);
    const [inputRef, isPopperVisible] = useVisibleState<HTMLDivElement>();

    const contextValue = React.useMemo<InputDecoratorContextType>(() => ({
        setRestrictions: (restriction) => {
            const restrictions = React.Children.toArray(restriction).map((r, index) => {
                return <Restriction key={`restriction-${index}`}>{r}</Restriction>;
            });
            setInputRestrictions(restrictions);
        },
        invalid: invalid,
        setInvalid: (invalid) => {
            if (typeof invalid === 'boolean') {
                setInvalid(invalid ? "Nieprawidłowa wartość" : undefined);
            } else {
                setInvalid(invalid);
            }
        },
    }), [invalid]);

    // Pobieranie właściwości bez klonowania
    const { required, disabled, size, defaultValue, value, color } = React.useMemo(() => {
        if (React.isValidElement(children)) {
            return {
                required: children.props.required ?? false,
                disabled: children.props.disabled ?? false,
                size: children.props.size ?? "medium",
                defaultValue: children.props.defaultValue,
                value: children.props.value,
                color: children.props.color ?? "primary",
            };
        }
        return {
            required: false,
            disabled: false,
            size: "medium",
            defaultValue: undefined,
            value: undefined,
            color: "primary",
        };
    }, [children]);

    const [previousValue] = React.useState(value);

    const classes = clsx(
        `size-${size}`,
        disabled && "disabled",
        required && "required",
        invalid && "invalid",
        selected && "selected",
        `color-${color}`,
    );

    const changed = JSON.stringify(previousValue) !== JSON.stringify(value);
    const isDefaultValue = JSON.stringify(value ?? defaultValue) === JSON.stringify(defaultValue);

    return (
        <InputDecoratorContext.Provider value={contextValue}>
            <StyledInputDecorator
                className={clsx(
                    "InputDecorator-root",
                    classes,
                    className
                )}
                width={width}
                onClick={onClick}
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
                            restrictions={[restrictions, inputRestrictions]}
                        />
                    )}
                    <StyledInputDecoratorInput
                        className={clsx(
                            "InputDecorator-input",
                            classes,
                        )}
                        ref={inputRef}
                    >
                        {children}
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
                    <StyledInputDecoratorValidity
                        disablePortal={true}
                        open={!!invalid && isPopperVisible}
                        anchorEl={inputRef.current || undefined}
                        placement="bottom-start"
                        sx={{
                            width: inputRef.current ? `${inputRef.current.offsetWidth}px` : undefined,
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
                </StyledInputDecoratorContainer>
            </StyledInputDecorator>
        </InputDecoratorContext.Provider>
    );
}
