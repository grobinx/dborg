import React, { createContext, useRef, ReactNode, useCallback } from "react";

export type RedrawMode = "full" | "only" | string;
export type RefreshSlotFunction = (id: string, redraw?: RedrawMode) => void;
type RefreshFunction = (redraw?: RedrawMode) => void;
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

    const registerRefresh = useCallback((id: string, fn: RefreshFunction) => {
        refreshers.current.set(id, fn);
        return () => {
            refreshers.current.delete(id);
        };
    }, []);

    const refreshSlot: RefreshSlotFunction = useCallback((id: string, redraw?: RedrawMode) => {
        const fn = refreshers.current.get(id);
        if (fn) {
            setTimeout(() =>
                requestAnimationFrame(() => {
                    if (refreshers.current.get(id)) {
                        fn(redraw);
                    }
                }), 0);
        }
    }, []);

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