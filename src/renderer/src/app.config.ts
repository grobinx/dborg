import { TSettings } from "src/api/settings";
import { SETTINGS_NAMES } from "./contexts/SettingsContext";

export interface AppSettings extends TSettings {
    toast: {
        /**
         * Maximum number of toast notifications
         */
        max: number;
        /**
         * Timeout for toast in milliseconds
         */
        timeout: number;
    };
    settings: {
        /**
         * Timeout for storing settings in milliseconds
         */
        store_timeout: number;
    };
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

const toast_max = 5;
const settings_store_timeout = 1000; // 1 second
const toast_timeout = 5000; // 5 seconds

export const default_settings: ApplicationSettings = {
    app: {
        toast: {
            max: toast_max,
            timeout: toast_timeout,
        },
        settings: {
            store_timeout: settings_store_timeout,
        },
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