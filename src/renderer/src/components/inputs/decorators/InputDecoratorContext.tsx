import { FormattedContent } from "@renderer/components/useful/FormattedText";
import React from "react";

export interface InputDecoratorContextType {
    /**
     * Ustawia nowe ograniczenia dla elementu
     * Może być pojedynczym elementem lub listą elementów, tekstem lub elementem React
     * Elementy będą opakowane w komponent Restriction lub inny podobny
     * @param restriction Nowa restrykcja do ustawienia
     */
    setRestrictions: (restriction: React.ReactNode) => void;
    /**
     * Przechowuje aktualne ograniczenia dla elementu
     */
    invalid: boolean | FormattedContent;
    /**
     * Ustawia nową wartość invalid
     * Może być wartością boolean lub komunikatem o błędzie
     * Jeśli jest nieprawidłowy, zostanie ustawiona odpowiednia klasa CSS "invalid"
     * @param invalid Czy element jest nieprawidłowy
     */
    setInvalid: (invalid: boolean | FormattedContent) => void;
    /**
     * Czy element jest w stanie fokusu
     */
    focused: boolean;
    /**
     * Ustawia nowy stan fokusu dla elementu
     * @param focused Czy element jest w stanie fokusu
     */
    setFocused: (focused: boolean) => void;
    /**
     * Typ elementu, który jest dekorowany
     * Może być używany do stylizacji lub logiki specyficznej dla typu
     */
    type: string;
    /**
     * Ustawia typ elementu
     * @param type Nowy typ elementu
     */
    setType: (type: string) => void;
}

export const InputDecoratorContext = React.createContext<InputDecoratorContextType | null>(null);

export function useInputDecorator() {
    return React.useContext(InputDecoratorContext);
}
