import { FormattedContent } from "@renderer/components/useful/FormattedText";
import React from "react";
import { ThemeColor } from "../../../types/colors";
import { Size } from "../../../types/sizes";
import { SxProps } from "@mui/material";

export interface BaseInputProps<T = any> {
    id?: string;
    className?: string;

    value?: T;
    /**
     * Domyślna wartość, która będzie ustawiona przy pierwszym renderowaniu jeśli nie podano wartości w value
     * Jeśli nie zostanie podana, wartość będzie pusta
     */
    defaultValue?: T;
    /**
     * Czy element jest wyłączony
     * Zostanie ustawiona odpowiednia klasa CSS "disabled"
     * Jeśli element jest wyłączony, nie będzie można go edytować ani klikać
     * @default false
     */
    disabled?: boolean;
    /**
     * Czy element jest wymagany
     * Zostanie ustawiona odpowiednia klasa CSS "required"
     * Jeśli element jest wymagany, będzie musiał mieć wartość przed wysłaniem formularza
     * @default false
     */
    required?: boolean;
    /**
     * Funkcja wywoływana po zmianie wartości
     * @param value Nowa wartość
     * @param args Dodatkowe argumenty
     * @returns
     */
    onChange?: (value: T) => void;
    /**
     * Funkcja wywoływana z opóźnieniem po zmianie wartości, po walidacji.
     * Może być używana do aktualizacji stanu lub wykonania innych działań po zmianie wartości,
     * kiedy wartość jest poprawna.
     * @param value Nowa wartość
     */
    onChanged?: (value: T | undefined) => void;
    /**
     * Czas opóźnienia w milisekundach przed wywołaniem funkcji onChanged
     * Używane do opóźnienia aktualizacji stanu lub innych działań po zmianie wartości
     * @default 500
     */
    changedDelay?: number;
    /**
     * Funkcja wywoływana po kliknięciu w dowolną część pola
     */
    onClick?: (e: React.MouseEvent<HTMLElement>) => void;
    /**
     * Funkcja wywoływana po ustawieniu fokusu
     */
    onFocus?: (e: React.FocusEvent<HTMLElement>) => void;
    /**
     * Funkcja wywoływana po utracie fokusu
     */
    onBlur?: (e: React.FocusEvent<HTMLElement>) => void;
    /**
     * Funkcja walidująca wartość
     * @param value Wartość do sprawdzenia
     * @returns true, jeśli wartość jest poprawna, lub komunikat o błędzie
     */
    onValidate?: (value: T) => boolean | FormattedContent;
    /**
     * Szerokość elementu
     * Może być podana jako liczba (w pikselach) lub jako string
     * Przykłady: 200, '100%', '50px', 'auto'
     * Jeśli nie zostanie podana, szerokość będzie ustawiona na 100%
     */
    width?: string | number;
    /**
     * Wysokość elementu
     * Może być podana jako liczba (w pikselach) lub jako string
     * Przykłady: 40, '100%', '50px', 'auto'
     * Jeśli nie zostanie podana, wysokość będzie ustawiona na automatyczną
     */
    height?: string | number;
    /**
     * Nazwa koloru z palety MUI, np. 'primary', 'secondary', 'error', 'warning', 'info', 'success'
     * Kolor nie zostanie zmieniony ale ustawiona zostanie odpowiednia klasa CSS "color-..."
     * @default 'primary'
     */
    color?: ThemeColor | 'default';
    /**
     * Rozmiar elementu, np. 'small', 'medium', 'large'
     * Rozmiar nie zostanie zmieniony ale ustawiona zostanie odpowiednia klasa CSS "size-..."
     * @default 'medium'
     */
    size?: Size | 'default';
    /**
     * Referencja do elementu kontenera
     */
    ref?: React.RefObject<HTMLDivElement | null>;
    /**
     * Referencja do elementu wejściowego
     * Używana do bezpośredniego dostępu do elementu wejściowego, np. do ustawienia fokusu lub odczytu wartości
     * Jeśli nie zostanie podana, nie będzie możliwe bezpośrednie odwołanie się do elementu wejściowego
     */
    inputRef?: React.Ref<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
    /**
     * Ustaw autofocus na elemencie wejściowym
     */
    autoFocus?: boolean;
    /**
     * Czy używać gęstego odstępu wewnętrznego (padding)
     */
    dense?: boolean;

    onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
    onKeyUp?: (event: React.KeyboardEvent<HTMLElement>) => void;

    tooltip?: FormattedContent;

    sx?: SxProps;
    style?: React.CSSProperties;
}
