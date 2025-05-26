import React, { createContext, useContext, useRef, useCallback } from "react";

type RefType = "monaco.editor" | "datagrid" | "html";

interface RegisteredRef {
    type: RefType;
    value: React.RefObject<any>;
}

interface RefSlotContextValue {
    registerRefSlot: (id: string, type: RefType, value: any) => () => void;
    getRefSlot: <T = any>(id: string, type?: RefType) => React.RefObject<T> | undefined;
}

const RefSlotContext = createContext<RefSlotContextValue | null>(null);

export const RefSlotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const contexts = useRef<Map<string, RegisteredRef>>(new Map());

    const registerRefSlot = useCallback(
        (id: string, type: RefType, value: React.RefObject<any>): (() => void) => {
            contexts.current.set(id, { type, value });

            // Zwróć funkcję do wyrejestrowania kontekstu
            return () => {
                contexts.current.delete(id);
            };
        },
        [] // Brak zależności, funkcja pozostaje stabilna
    );

    const getRefSlot = useCallback(
        <T = any>(id: string, type?: RefType): React.RefObject<T> | undefined => {
            const context = contexts.current.get(id);
            if (type && context?.type !== type) {
                return undefined; // Zwróć undefined, jeśli typ nie pasuje
            }
            return context?.value as React.RefObject<T> | undefined;
        },
        [] // Brak zależności, funkcja pozostaje stabilna
    );

    return (
        <RefSlotContext.Provider value={{ registerRefSlot, getRefSlot }}>
            {children}
        </RefSlotContext.Provider>
    );
};

export const useRefSlot = (): RefSlotContextValue => {
    const context = useContext(RefSlotContext);
    if (!context) {
        throw new Error("useRefSlotContext must be used within a RefSlotProvider");
    }
    return context;
};