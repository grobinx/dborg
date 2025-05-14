import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { uuidv7 } from "uuidv7";
import { useSettings } from "./SettingsContext";
import { AppSettings } from "@renderer/app.config";

export type NotificationType = "error" | "warning" | "success" | "info" | "hint";

interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    close: boolean;
    posted: number;
    shown?: boolean; // Indicates if the notification has been displayed
    timeout?: number; // Optional timeout for auto-dismissal
    source?: string; // Source of the notification (eg component name)
    reason?: unknown; // Reason for the notification (eg error object)
    time?: number; // Time when the notification was created
    toast?: boolean; // Optional property to indicate if the notification is a toast
}

interface NotificationOptions {
    timeout?: number;
    /**
     * Source of the notification (eg component name)
     */
    source?: string;
    /**
     * Reason for the notification (eg error object)
     */
    reason?: unknown;
    /**
     * Optional property to indicate if the notification is a toast
     * @default: true
     */
    toast?: boolean; // Optional property to indicate if the notification is a toast
}

interface NotificationContextType {
    addNotification: (type: NotificationType, message: string, options?: NotificationOptions) => void;
    removeNotification: (id: string) => void;
    dispatchNotification: (id: string) => void;
    showedNotification: (id: string) => void;
    notifications: Notification[];
    notificationCounts: Record<NotificationType, number>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
    const [notifications, setNotifications] = useState<Notification[]>(() => {
        const storedNotifications = sessionStorage.getItem("notifications");
        return storedNotifications ? JSON.parse(storedNotifications) : [];
    });
    const [notificationCounts, setNotificationCounts] = useState<Record<NotificationType, number>>(accumulateNotificationCounts(notifications));
    const [settings] = useSettings<AppSettings>("app");

    function accumulateNotificationCounts(notifications: Notification[]) {
        return notifications.reduce<Record<NotificationType, number>>((acc, notification) => {
            acc[notification.type] = (acc[notification.type] || 0) + 1;
            return acc;
        }, {
            error: 0,
            warning: 0,
            success: 0,
            info: 0,
            hint: 0,
        });
    };

    const updateNotificationCounts = (changedNotifications: Notification[]) => {
        setNotificationCounts(accumulateNotificationCounts(changedNotifications));
    };

    const saveNotificationsToSession = (notifications: Notification[]) => {
        sessionStorage.setItem("notifications", JSON.stringify(notifications));
    };

    const addNotification = (type: NotificationType, message: string, options?: NotificationOptions) => {
        const id = uuidv7();
        if (type === "error") {
            console.error(message, options?.reason);
        }
        setNotifications((prev) => {
            const newNotification = {
                id, type, message, close: false, posted: Date.now(), shown: false,
                timeout: options?.timeout ?? settings.notification_timeout,
                source: options?.source,
                reason: options?.reason,
                time: Date.now(),
                toast: options?.toast ?? true, // Default to true if not provided
            };
            const updatedNotifications = [...prev, newNotification];
            updateNotificationCounts(updatedNotifications); // Update counts with the new notification
            saveNotificationsToSession(updatedNotifications); // Save to sessionStorage
            return updatedNotifications;
        });
    };

    const removeNotification = (id: string) => {
        setNotifications((prev) => {
            const removedNotification = prev.find((notification) => notification.id === id);
            const updatedNotifications = prev.filter((notification) => notification.id !== id);
            if (removedNotification) {
                updateNotificationCounts(updatedNotifications); // Update counts with the remaining notifications
                saveNotificationsToSession(updatedNotifications); // Save to sessionStorage
            }
            return updatedNotifications;
        });
    };

    const dispatchNotification = (id: string) => {
        setNotifications((prev) => {
            const updatedNotifications = prev.map((notification) =>
                notification.id === id && !notification.close
                    ? { ...notification, close: true }
                    : notification
            );
            saveNotificationsToSession(updatedNotifications); // Save to sessionStorage
            return updatedNotifications;
        });
    };

    const showedNotification = (id: string) => {
        setNotifications((prev) => {
            const updatedNotifications = prev.map((notification) =>
                notification.id === id && !notification.shown
                    ? { ...notification, shown: true }
                    : notification
            );
            saveNotificationsToSession(updatedNotifications); // Save to sessionStorage
            return updatedNotifications;
        });

        const notification = notifications.find((n) => n.id === id);
        if (notification && notification.timeout) {
            setTimeout(() => {
                dispatchNotification(id);
            }, notification.timeout);
        }
    };

    // Periodically remove notifications older than one hour
    useEffect(() => {
        const interval = setInterval(() => {
            const oneHourAgo = Date.now() - settings.remove_notification_timeout; // 1 hour in milliseconds
            const hasOldNotifications = notifications.some((notification) => notification.posted < oneHourAgo);
            if (!hasOldNotifications) {
                return;
            }
            setNotifications((prev) => {
                const updatedNotifications = prev.filter((notification) => notification.posted >= oneHourAgo);
                updateNotificationCounts(updatedNotifications); // Update counts with the remaining notifications
                saveNotificationsToSession(updatedNotifications); // Save to sessionStorage
                return updatedNotifications;
            });
        }, settings.notification_check_interval); // Check every minute

        return () => clearInterval(interval);
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                addNotification,
                removeNotification,
                dispatchNotification,
                showedNotification,
                notifications,
                notificationCounts,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    const { notifications, addNotification } = context;
    return { notifications, addNotification };
};

export const useNotificationAdmin = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotificationAdmin must be used within a NotificationProvider");
    }
    return context; // Return full context for administrative purposes
};
