import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { uuidv7 } from "uuidv7";
import { useSetting } from "./SettingsContext";
import { useMessages } from "./MessageContext";

export type ToastType = "error" | "warning" | "success" | "info" | "hint";

export const TOAST_ADD_MESSAGE = "toast:add";
export interface ToastAddMessage {
    type: ToastType;
    message: string;
    options?: ToastOptions;
} 

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    posted: number;
    shown?: boolean; // Indicates if the notification has been displayed
    timeout?: number; // Optional timeout for auto-dismissal
    source?: string; // Source of the notification (eg component name)
    reason?: unknown; // Reason for the notification (eg error object)
    time?: number; // Time when the notification was created
}

interface ToastOptions {
    timeout?: number;
    /**
     * Source of the notification (eg component name)
     */
    source?: string;
    /**
     * Reason for the notification (eg error object)
     */
    reason?: unknown;
}

interface ToastContextType {
    addToast: (type: ToastType, message: string, options?: ToastOptions) => void;
    dispatchToast: (id: string) => void;
    showedToast: (id: string) => void;
    toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [timeout] = useSetting<number>("app", "toast.timeout");
    const { subscribe } = useMessages();

    const addToast = useCallback((type: ToastType, message: string, options?: ToastOptions) => {
        const id = uuidv7();
        if (type === "error") {
            console.error(message, options?.reason);
        }
        setToasts((prev) => {
            const newNotification: Toast = {
                id,
                type,
                message,
                posted: Date.now(),
                shown: false,
                timeout: options?.timeout ?? timeout,
                source: options?.source,
                reason: options?.reason,
                time: Date.now(),
            };
            const updatedNotifications = [...prev, newNotification];
            return updatedNotifications;
        });
    }, [timeout]);

    const dispatchToast = useCallback((id: string) => {
        setToasts((prev) => {
            return prev.filter((notification) => notification.id !== id);
        });
    }, []);

    const showedToast = useCallback((id: string) => {
        setToasts((prev) => {
            const updatedToasts = prev.map((toast) =>
                toast.id === id && !toast.shown
                    ? { ...toast, shown: true }
                    : toast
            );
            return updatedToasts;
        });

        const toast = toasts.find((n) => n.id === id);
        if (toast && toast.timeout) {
            setTimeout(() => {
                dispatchToast(id);
            }, toast.timeout);
        }
    }, [toasts, dispatchToast]);

    useEffect(() => {
        const unsubscribe = subscribe(TOAST_ADD_MESSAGE, (msg: ToastAddMessage) => {
            addToast(msg.type, msg.message, msg.options);
        });

        return () => {
            unsubscribe();
        };
    }, [subscribe, addToast]);

    return (
        <ToastContext.Provider
            value={{
                addToast,
                dispatchToast,
                showedToast,
                toasts,
            }}
        >
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    const { addToast } = context;
    return addToast;
};

export const useToastAdmin = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToastAdmin must be used within a ToastProvider");
    }
    return context;
};
