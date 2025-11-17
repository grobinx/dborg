import { useEffect, useState, useCallback } from "react";

// Typ dla globalnych wartości
type GlobalValues = Record<string, any>;
type GlobalSubscribers = Record<string, ((value: any) => void)[]>;

const globalValues: GlobalValues = {};
const globalSubscribers: GlobalSubscribers = {};

// Pobieranie wartości
export function getGlobalValue<T = any>(key: string, defaultValue?: T): T {
    return key in globalValues ? globalValues[key] as T : defaultValue as T;
}

// Ustawianie wartości (obsługa funkcji)
export function setGlobalValue<T = any>(key: string, value: T | ((prev: T) => T)): void {
    const prev = globalValues[key] as T;
    const next = typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
    if (prev !== next) {
        globalValues[key] = next;
        // Powiadom subskrybentów
        if (globalSubscribers[key]) {
            globalSubscribers[key].forEach(cb => cb(next));
        }
    }
}

// Subskrypcja zmian
export function subscribeGlobalValue(key: string, callback: (value: any) => void): () => void {
    if (!globalSubscribers[key]) globalSubscribers[key] = [];
    globalSubscribers[key].push(callback);
    return () => {
        globalSubscribers[key] = globalSubscribers[key].filter(cb => cb !== callback);
        if (globalSubscribers[key].length === 0) delete globalSubscribers[key];
    };
}

// Hook do używania globalnej wartości
export function useGlobalValue<T = any>(key: string, defaultValue?: T): [T, (value: T | ((prev: T) => T)) => void] {
    const [value, setValueState] = useState<T>(() => getGlobalValue<T>(key, defaultValue));

    useEffect(() => {
        const unsubscribe = subscribeGlobalValue(key, (val) => setValueState(val));
        return unsubscribe;
    }, [key]);

    const setValue = useCallback((val: T | ((prev: T) => T)) => {
        setGlobalValue<T>(key, val);
    }, [key]);

    return [value, setValue];
}