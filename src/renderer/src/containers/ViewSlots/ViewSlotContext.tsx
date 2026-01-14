import React, { createContext, useRef, ReactNode, useCallback } from "react";

export type RedrawMode = "full" | "only" | string;
export type RefreshSlotFunction = (id: string, redraw?: RedrawMode) => void;
type RefreshFunction = (redraw?: RedrawMode) => void;
type RegisterRefreshSlotFunction = (id: string, fn: RefreshFunction) => () => void;

export type DialogSlotFunction = (id: string, params?: Record<string, any>) => void;
type RegisterDialogFunction = (ids: string | string[], fn: DialogSlotFunction) => () => void;
type OpenDialogFunction = (id: string, params?: Record<string, any>) => void;

type ViewSlotContextType = {
    registerRefresh: RegisterRefreshSlotFunction;
    refreshSlot: RefreshSlotFunction;
    registerDialog: RegisterDialogFunction;
    openDialog: OpenDialogFunction;
};

export const ViewSlotContext = createContext<ViewSlotContextType>({
    registerRefresh: () => () => { },
    refreshSlot: (_id: string) => { },
    registerDialog: () => () => { },
    openDialog: (_id: string, _params?: Record<string, any>) => { },
});

export const ViewSlotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const refreshers = useRef(new Map<string, RefreshFunction>());
    const dialogs = useRef(new Map<string, DialogSlotFunction>());

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

    const registerDialog = useCallback((ids: string | string[], fn: DialogSlotFunction) => {
        const idArray = Array.isArray(ids) ? ids : [ids];
        idArray.forEach(id => dialogs.current.set(id, fn));
        return () => {
            idArray.forEach(id => dialogs.current.delete(id));
        };
    }, []);

    const openDialog: OpenDialogFunction = useCallback((id: string, params?: Record<string, any>) => {
        const fn = dialogs.current.get(id);
        if (fn) {
            setTimeout(() =>
                requestAnimationFrame(() => {
                    if (dialogs.current.get(id)) {
                        fn(id, params);
                    }
                }), 0);
        }
    }, []);

    return (
        <ViewSlotContext.Provider value={{ registerRefresh, refreshSlot, registerDialog, openDialog }}>
            {children}
        </ViewSlotContext.Provider>
    );
};

export const useViewSlot = () => {
    const context = React.useContext(ViewSlotContext);
    if (!context) {
        throw new Error("useViewSlot must be used within a ViewSlotProvider");
    }
    return context;
};