import React, { createContext, useContext, useRef } from "react";

type RefType = "editor" | "datagrid" | "html" | "tabcontent" | "content";

interface RegisteredRef {
    type: RefType;
    value: React.RefObject<any>;
}

interface SubscriberEntry {
    subscriberId: string;
    type?: RefType;
    cb: () => void;
}

interface RefSlotContextValue {
    registerRefSlot: (id: string, type: RefType, value: any) => () => void;
    getRefSlot: <T = any>(id: string, type?: RefType) => React.RefObject<T> | undefined;
    onRegisterRefSlot: (id: string, registerSlotId: string | undefined, type: RefType, callback: () => void) => () => void;
}

const RefSlotContext = createContext<RefSlotContextValue | null>(null);

export const RefSlotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const contexts = useRef<Map<string, RegisteredRef>>(new Map());
    const subscribers = useRef<Map<string, SubscriberEntry[]>>(new Map()); // key = registerSlotId

    const registerRefSlot = (id: string, type: RefType, value: React.RefObject<any>): (() => void) => {
        contexts.current.set(id, { type, value });

        // notify subscribers waiting for this slot id
        const subs = subscribers.current.get(id);
        if (subs && subs.length > 0) {
            subs.slice().forEach(entry => {
                if (!entry.type || entry.type === type) {
                    try { entry.cb(); } catch { /* ignore errors from subscriber callbacks */ }
                }
            });
        }

        // return unregister function
        return () => {
            contexts.current.delete(id);
        };
    };

    const getRefSlot = (id: string, type?: RefType): React.RefObject<any> | undefined => {
        const context = contexts.current.get(id);
        if (type && context?.type !== type) {
            return undefined;
        }
        return context?.value as React.RefObject<any> | undefined;
    };

    const onRegisterRefSlot = (subscriberId: string, registerSlotId: string | undefined, type: RefType, callback: () => void): (() => void) => {
        if (!registerSlotId) {
            return () => { };
        }

        const list = subscribers.current.get(registerSlotId) ?? [];
        const entry: SubscriberEntry = { subscriberId, type, cb: callback };
        list.push(entry);
        subscribers.current.set(registerSlotId, list);

        // If ref already registered and types match, call immediately
        const existing = contexts.current.get(registerSlotId);
        if (existing && (!type || existing.type === type)) {
            try { callback(); } catch { /* ignore */ }
        }

        // unsubscribe
        return () => {
            const current = subscribers.current.get(registerSlotId);
            if (!current) return;
            const idx = current.indexOf(entry);
            if (idx >= 0) current.splice(idx, 1);
            if (current.length === 0) subscribers.current.delete(registerSlotId);
            else subscribers.current.set(registerSlotId, current);
        };
    };

    return (
        <RefSlotContext.Provider value={{ registerRefSlot, getRefSlot, onRegisterRefSlot }}>
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