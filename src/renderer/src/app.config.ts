import { TSettings } from "src/api/settings";
import "./components/notifications/NotificationAdminList";
import { SETTINGS_NAMES } from "./contexts/SettingsContext";

export interface AppSettings extends TSettings {
    /**
     * Maximum number of toast notifications
     */
    max_toast: number;
    /**
     * Maximum number of announcements
     */
    max_notifications: number;
    /**
     * Timeout for notifications (toast) in milliseconds
     */
    notification_timeout: number;
    /**
     * Timeout for removing notifications in milliseconds
     */
    remove_notification_timeout: number;
    /**
     * Interval for checking notifications in milliseconds
     */
    notification_check_interval: number;
    /**
     * Timeout for storing settings in milliseconds
     */
    store_settings_timeout: number;
}

export interface DborgSettings extends TSettings {
    // Dodaj właściwości specyficzne dla "dborg", jeśli istnieją
    data_grid: {
        null_value: string;
        colors_enabled: boolean;
        max_value_length: number;
    }
}

export interface UiSettings extends TSettings {
    theme: 'system' | 'light' | 'dark';
}

export interface ApplicationSettings extends TSettings {
    app: AppSettings;
    dborg: DborgSettings;
    ui: UiSettings;
}

const max_toast = 5;
const max_notifications = 50;
const notification_timeout = 5000;
const remove_notification_timeout = 3600000; // 1 hour
const notification_check_interval = 30000; // 30 seconds
const store_settings_timeout = 1000; // 1 second
const data_grid_max_value_length = 2000; // Maximum length of display data grid value

export const default_settings: ApplicationSettings = {
    app: {
        max_toast,
        max_notifications,
        notification_timeout,
        remove_notification_timeout,
        notification_check_interval,
        store_settings_timeout,
    },
    dborg: {
        data_grid: {
            null_value: '{null}',
            colors_enabled: true,
            max_value_length: data_grid_max_value_length,
        },
    },
    ui: {
        theme: 'system',
    },
};

SETTINGS_NAMES['app'] = default_settings.app;
SETTINGS_NAMES['dborg'] = default_settings.dborg;
SETTINGS_NAMES['ui'] = default_settings.ui;