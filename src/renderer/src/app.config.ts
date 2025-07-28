import { TSettings } from "src/api/settings";
import { settingsGroups } from "./contexts/SettingsContext";
import editableSettingsRegistry from "./components/settings/EditableSettingsRegistry";
import i18next from "i18next";

export interface AppSettings extends TSettings {
    "settings.store_timeout"?: number;

    placement?: 'left' | 'right' | 'top' | 'bottom';

    "toast.max"?: number;
    "toast.timeout"?: number;
}

export interface DborgSettings extends TSettings {
    "data_grid.null_value"?: string;
    "data_grid.colors_enabled"?: boolean;
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
const data_grid_null_value = '{null}';
const data_grid_colors_enabled = true;

export const default_settings: ApplicationSettings = {
    app: {
        placement: 'left',
        "toast.max": toast_max,
        "toast.timeout": toast_timeout,

        "settings.store_timeout": settings_store_timeout,
    },
    dborg: {
        "data_grid.null_value": data_grid_null_value,
        "data_grid.colors_enabled": data_grid_colors_enabled,
    },
    ui: {
        theme: 'system',
    },
};

settingsGroups['app'] = default_settings.app;
settingsGroups['dborg'] = default_settings.dborg;
settingsGroups['ui'] = default_settings.ui;

editableSettingsRegistry.register((context) => {
    const t = i18next.t.bind(i18next);

    context.registerCollection({
        key: 'app',
        title: t('application-settings', 'Application Settings'),
        description: t('application-settings-description', 'Settings related to the application behavior and appearance.'),
        groups: [{
            key: 'toast',
            title: t('toast-notifications', 'Toast Notifications'),
            description: t('toast-notifications-description', 'Settings for toast notifications.'),
            settings: [
                {
                    key: 'max',
                    type: 'number',
                    label: t('maximum-toasts', 'Maximum Toasts'),
                    description: t('maximum-toasts-description', 'Maximum number of toast notifications to display at once.'),
                    defaultValue: toast_max,
                    min: 1,
                    max: 20,
                    step: 1,
                },
                {
                    key: 'timeout',
                    type: 'number',
                    label: t('toast-timeout', 'Toast Timeout'),
                    description: t('toast-timeout-description', 'Timeout for each toast notification in milliseconds.'),
                    defaultValue: toast_timeout,
                    min: 1000,
                    max: 30000,
                    step: 1000,
                },
            ],
        }],
    });

    context.registerCollection({
        key: 'dborg',
        title: t('orbada-settings', 'Orbada Settings'),
        description: t('orbada-settings-description', 'Settings related to the Orbada database management.'),
        groups: [{
            key: 'data_grid',
            title: t('data-grid', 'Data Grid'),
            description: t('data-grid-description', 'Settings for the data grid display.'),
            settings: [
                {
                    key: 'null_value',
                    type: 'string',
                    label: t('null-value-representation', 'Null Value Representation'),
                    description: t('null-value-representation-description', 'String representation for null values in the data grid.'),
                    defaultValue: data_grid_null_value,
                },
                {
                    key: 'colors_enabled',
                    type: 'boolean',
                    label: t('enable-colors', 'Enable Colors'),
                    description: t('enable-colors-description', 'Enable or disable color coding in the data grid.'),
                    defaultValue: data_grid_colors_enabled,
                },
            ],
        }],
    });
});