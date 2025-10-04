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
const data_grid_data_colors_enabled = true;
const data_grid_dafined_colors_enabled = true;
const data_grid_active_highlight = true;
const data_grid_data_font_size = 14;
const data_grid_defined_font_size = 14;

export const default_settings: ApplicationSettings = {
    app: {
        placement: 'left',
        "toast.max": toast_max,
        "toast.timeout": toast_timeout,

        "settings.store_timeout": settings_store_timeout,
    },
    dborg: {
        "data_grid.null_value": data_grid_null_value,
        "data_grid.data.colors_enabled": data_grid_data_colors_enabled,
        "data_grid.defined.colors_enabled": data_grid_dafined_colors_enabled,
        "data_grid.active_highlight": data_grid_active_highlight,
        "data_grid.data.font_size": data_grid_data_font_size,
        "data_grid.defined.font_size": data_grid_defined_font_size,
        "data_grid.data.row_number_column": true,
        "data_grid.defined.row_number_column": false,
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
                    storageKey: 'toast.max',
                    label: t('maximum-toasts', 'Maximum Toasts'),
                    description: t('maximum-toasts-description', 'Maximum number of toast notifications to display at once.'),
                    min: 1,
                    max: 20,
                    step: 1,
                },
                {
                    type: 'number',
                    storageGroup: 'app',
                    storageKey: 'toast.timeout',
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
            key: 'grid',
            title: t('grid', 'Grid'),
            description: t('data-grid-description', 'Settings for the data grid display.'),
            settings: [
                {
                    type: 'string',
                    storageGroup: 'dborg',
                    storageKey: 'data_grid.null_value',
                    category: t('content', 'Content'),
                    label: t('null-value-representation', 'Null Value Representation'),
                    description: t('null-value-representation-description', 'String representation for null values in the data grid.'),
                },
            ],
            groups: [
                {
                    key: 'data-grid',
                    title: t('settings.data-grid', 'Data grid'),
                    description: t('settings.data-grid-description', 'Settings for the main data grid display.'),
                    settings: [
                        {
                            type: 'boolean',
                            storageGroup: 'dborg',
                            storageKey: 'data_grid.active_highlight',
                            category: t('appearance', 'Appearance'),
                            label: t('settings.highlight-active-cell', 'Highlight active row and column'),
                            description: t('settings.highlight-active-cell-description', 'Highlight the active row and column in the data grid.'),
                        },
                        {
                            type: 'boolean',
                            storageGroup: 'dborg',
                            storageKey: 'data_grid.data.colors_enabled',
                            category: t('appearance', 'Appearance'),
                            label: t('settings.enable-colors', 'Enable colors in grid'),
                            description: t('settings.enable-colors-description', 'Enable or disable color coding based on the field type in the grid.'),
                        },
                        {
                            type: 'number',
                            storageGroup: 'dborg',
                            storageKey: 'data_grid.data.font_size',
                            category: t('appearance', 'Appearance'),
                            label: t('settings.font-size', 'Grid font size'),
                            description: t('settings.font-size-description', 'Font size for the grid.'),
                            min: 10,
                            max: 24,
                            step: 1,
                        },
                        {
                            type: 'boolean',
                            storageGroup: 'dborg',
                            storageKey: 'data_grid.data.row_number_column',
                            category: t('behavior', 'Behavior'),
                            label: t('settings.show-row-numbers', 'Show row numbers column'),
                            description: t('settings.show-row-numbers-description', 'Show or hide the row numbers column in the grid.'),
                        },
                    ],
                },
                {
                    key: 'defined-grid',
                    title: t('settings.defined-grid', 'Defined grid'),
                    description: t(
                        'settings.defined-grid-description',
                        'Settings for the defined grid display. Defined grid is the grid with predefined columns, like in table list or foreign keys.'
                    ),
                    settings: [
                        {
                            type: 'boolean',
                            storageGroup: 'dborg',
                            storageKey: 'data_grid.defined.colors_enabled',
                            category: t('appearance', 'Appearance'),
                            label: t('settings.enable-colors', 'Enable colors in grid'),
                            description: t('settings.enable-colors-description', 'Enable or disable color coding based on the field type in the grid.'),
                        },
                        {
                            type: 'number',
                            storageGroup: 'dborg',
                            storageKey: 'data_grid.defined.font_size',
                            category: t('appearance', 'Appearance'),
                            label: t('settings.font-size', 'Grid font size'),
                            description: t('settings.font-size-description', 'Font size for the grid.'),
                            min: 10,
                            max: 24,
                            step: 1,
                        },
                        {
                            type: 'boolean',
                            storageGroup: 'dborg',
                            storageKey: 'data_grid.defined.row_number_column',
                            category: t('behavior', 'Behavior'),
                            label: t('settings.show-row-numbers', 'Show row numbers column'),
                            description: t('settings.show-row-numbers-description', 'Show or hide the row numbers column in the grid.'),
                        },
                    ],
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
                    type: 'select',
                    storageGroup: 'ui',
                    storageKey: 'theme',
                    label: t('theme', 'Theme'),
                    description: t('theme-description', 'Select the application theme.'),
                    options: [
                        { value: "light", label: t('light-theme', 'Light') },
                        { value: "dark", label: t('dark-theme', 'Dark') },
                        { value: "system", label: t('system-theme', 'System Default') },
                    ],
                },
            ],
        },
        {
            key: 'font',
            title: t('font-settings', 'Font Settings'),
            description: t('font-settings-description', 'Settings for font size and family.'),
            settings: [
                {
                    type: 'number',
                    storageGroup: 'ui',
                    storageKey: 'fontSize',
                    label: t('font-size', 'Font Size'),
                    description: t('font-size-description', 'Set the base font size for the application.'),
                    min: 10,
                    max: 20,
                    step: 1,
                },
                {
                    type: 'string',
                    storageGroup: 'ui',
                    storageKey: 'fontFamily',
                    label: t('font-family', 'Font Family'),
                    description: t('font-family-description', 'Set the base font family for the application.'),
                },
                {
                    type: 'string',
                    storageGroup: 'ui',
                    storageKey: 'monospaceFontFamily',
                    label: t('monospace-font-family', 'Monospace Font Family'),
                    description: t('monospace-font-family-description', 'Set the monospace font family for code and other monospaced text.'),
                },
            ],
        }],
    });
});
