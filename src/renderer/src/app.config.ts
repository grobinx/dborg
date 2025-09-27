import { TSettings } from "src/api/settings";
import { settingsGroupDefaults } from "./contexts/SettingsContext";
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
    fontSize?: number;
    fontFamily?: string;
    monospaceFontFamily?: string;
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
const data_grid_active_highlight = true;

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
        "data_grid.active_highlight": data_grid_active_highlight,
    },
    ui: {
        theme: 'system',
        fontSize: 14,
        fontFamily: 'Segoe WPC, Segoe UI, sans-serif',
        monospaceFontFamily: 'Consolas, monospace, Courier New, Courier',
    },
};

settingsGroupDefaults['app'] = default_settings.app;
settingsGroupDefaults['dborg'] = default_settings.dborg;
settingsGroupDefaults['ui'] = default_settings.ui;

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
                    type: 'number',
                    storageGroup: 'app',
                    key: 'toast.max',
                    label: t('maximum-toasts', 'Maximum Toasts'),
                    description: t('maximum-toasts-description', 'Maximum number of toast notifications to display at once.'),
                    min: 1,
                    max: 20,
                    step: 1,
                },
                {
                    type: 'number',
                    storageGroup: 'app',
                    key: 'toast.timeout',
                    label: t('toast-timeout', 'Toast Timeout'),
                    description: t('toast-timeout-description', 'Timeout for each toast notification in milliseconds.'),
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
                    type: 'string',
                    storageGroup: 'dborg',
                    key: 'data_grid.null_value',
                    label: t('null-value-representation', 'Null Value Representation'),
                    description: t('null-value-representation-description', 'String representation for null values in the data grid.'),
                },
                {
                    type: 'boolean',
                    storageGroup: 'dborg',
                    key: 'data_grid.colors_enabled',
                    label: t('enable-colors', 'Enable Colors'),
                    description: t('enable-colors-description', 'Enable or disable color coding in the data grid.'),
                },
                {
                    type: 'boolean',
                    storageGroup: 'dborg',
                    key: 'data_grid.active_highlight',
                    label: t('highlight-active-cell', 'Highlight Active row and column'),
                    description: t('highlight-active-cell-description', 'Highlight the active row and column in the data grid.'),
                },
            ],
        }],
    });

    context.registerCollection({
        key: 'ui',
        title: t('ui-settings', 'UI Settings'),
        description: t('ui-settings-description', 'Settings related to the user interface.'),
        groups: [{
            key: 'theme',
            title: t('theme', 'Theme'),
            description: t('theme-description', 'Settings for the application theme.'),
            settings: [
                {
                    type: 'string',
                    storageGroup: 'ui',
                    key: 'theme',
                    label: t('theme', 'Theme'),
                    description: t('theme-description', 'Select the application theme.'),
                },
            ],
        }],
    });
    context.registerCollection({
        key: 'typography',
        title: t('typography-settings', 'Typography Settings'),
        description: t('typography-settings-description', 'Settings related to typography, including font size and family.'),
        groups: [{
            key: 'font',
            title: t('font-settings', 'Font Settings'),
            description: t('font-settings-description', 'Settings for font size and family.'),
            settings: [
                {
                    type: 'number',
                    storageGroup: 'ui',
                    key: 'fontSize',
                    label: t('font-size', 'Font Size'),
                    description: t('font-size-description', 'Set the base font size for the application.'),
                    min: 8,
                    max: 32,
                    step: 1,
                },
                {
                    type: 'string',
                    storageGroup: 'ui',
                    key: 'fontFamily',
                    label: t('font-family', 'Font Family'),
                    description: t('font-family-description', 'Set the base font family for the application.'),
                },
                {
                    type: 'string',
                    storageGroup: 'ui',
                    key: 'monospaceFontFamily',
                    label: t('monospace-font-family', 'Monospace Font Family'),
                    description: t('monospace-font-family-description', 'Set the monospace font family for code and other monospaced text.'),
                },
            ],
        }],
    });
});
