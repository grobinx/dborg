import React, { createContext, useRef, ReactNode } from "react";

export type RefreshSlotFunction = (id: string) => void;
type RefreshFunction = () => void;
type RegisterRefreshSlotFunction = (id: string, fn: RefreshFunction) => () => void;
type RefreshSlotContextType = {
    registerRefresh: RegisterRefreshSlotFunction;
    refreshSlot: RefreshSlotFunction;
};

export const RefreshSlotContext = createContext<RefreshSlotContextType>({
    registerRefresh: () => () => { },
    refreshSlot: (_id: string) => { },
});

export const RefreshSlotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const refreshers = useRef(new Map<string, RefreshFunction>());

    const registerRefresh = (id, fn) => {
        refreshers.current.set(id, fn);
        return () => {
            refreshers.current.delete(id);
        };
    };

    const refreshSlot = (id: string) => {
        const fn = refreshers.current.get(id);
        if (fn) {
            setTimeout(() =>
                requestAnimationFrame(() => {
                    fn();
                }), 0);
        }
    };

    return (
        <RefreshSlotContext.Provider value={{ registerRefresh, refreshSlot }}>
            {children}
        </RefreshSlotContext.Provider>
    );
};

export const useRefreshSlot = () => {
    const context = React.useContext(RefreshSlotContext);
    if (!context) {
        throw new Error("useRefreshSlot must be used within a RefreshSlotProvider");
    }
    return context;
}