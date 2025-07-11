import { TSettings } from "src/api/settings";
import { SETTINGS_NAMES } from "./contexts/SettingsContext";

export interface AppSettings extends TSettings {
    /**
     * Maximum number of toast notifications
     */
    max_toast: number;
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
const store_settings_timeout = 1000; // 1 second

export const default_settings: ApplicationSettings = {
    app: {
        max_toast,
        store_settings_timeout,
    },
    dborg: {
        data_grid: {
            null_value: '{null}',
            colors_enabled: true,
        },
    },
    ui: {
        theme: 'system',
    },
};

SETTINGS_NAMES['app'] = default_settings.app;
SETTINGS_NAMES['dborg'] = default_settings.dborg;
SETTINGS_NAMES['ui'] = default_settings.ui;