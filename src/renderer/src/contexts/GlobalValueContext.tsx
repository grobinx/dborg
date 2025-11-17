import React, { createContext, useContext, useEffect, useState } from "react";

// Typ dla globalnych wartości
type GlobalValues = Record<string, any>;
type GlobalSubscribers = Record<string, ((value: any) => void)[]>;

const globalValues: GlobalValues = {};
const globalSubscribers: GlobalSubscribers = {};

// Kontekst
interface GlobalValueContextType {
    getValue: <T = any>(key: string, defaultValue?: T) => T;
    setValue: <T = any>(key: string, value: T | ((prev: T) => T)) => void;
    subscribe: (key: string, callback: (value: any) => void) => () => void;
}

export const GlobalValueContext = createContext<GlobalValueContextType | undefined>(undefined);

// Provider
export const GlobalValueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Funkcja pobierania wartości
    const getValue = <T = any>(key: string, defaultValue?: T): T => {
        return key in globalValues ? globalValues[key] as T : defaultValue as T;
    };

    // Funkcja ustawiania wartości (z obsługą funkcji)
    const setValue = <T = any>(key: string, value: T | ((prev: T) => T)) => {
        const prev = globalValues[key] as T;
        const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
        if (prev !== next) {
            globalValues[key] = next;
            // Powiadom subskrybentów
            if (globalSubscribers[key]) {
                globalSubscribers[key].forEach(cb => cb(next));
            }
        }
    };

    // Subskrypcja zmian
    const subscribe = (key: string, callback: (value: any) => void) => {
        if (!globalSubscribers[key]) globalSubscribers[key] = [];
        globalSubscribers[key].push(callback);
        return () => {
            globalSubscribers[key] = globalSubscribers[key].filter(cb => cb !== callback);
            if (globalSubscribers[key].length === 0) delete globalSubscribers[key];
        };
    };

    return (
        <GlobalValueContext.Provider value={{ getValue, setValue, subscribe }}>
            {children}
        </GlobalValueContext.Provider>
    );
};

// Hook do używania globalnej wartości
export function useGlobalValue<T = any>(key: string, defaultValue?: T): [T, (value: T | ((prev: T) => T)) => void] {
    const ctx = useContext(GlobalValueContext);
    if (!ctx) throw new Error("useGlobalValue must be used within GlobalValueProvider");

    const [value, setValueState] = useState<T>(() => ctx.getValue<T>(key, defaultValue));

    useEffect(() => {
        const unsubscribe = ctx.subscribe(key, (val) => setValueState(val));
        return unsubscribe;
    }, [key, ctx]);

    const setValue = React.useCallback((val: T | ((prev: T) => T)) => {
        ctx.setValue<T>(key, val);
    }, [key, ctx]);

    return [value, setValue];
}