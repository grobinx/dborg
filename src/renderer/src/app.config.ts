import { TSettings } from "src/api/settings";
import { settingsGroupDefaults } from "./contexts/SettingsContext";
import settingsRegistry from "./components/settings/SettingsRegistry";
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
const toast_timeout = 5000; // 5 seconds
const data_grid_null_value = '{null}';
const data_grid_data_colors_enabled = true;
const data_grid_dafined_colors_enabled = true;
const data_grid_active_highlight = true;
const data_grid_data_font_size = 14;
const data_grid_defined_font_size = 14;

/* general settings */
const settings_store_timeout = 1000; // 1 second
const search_delay = 300; // 300 ms

export type QueryHistoryDeduplicateMode = "none" | "time-based" | "aggressive";

export const default_settings: ApplicationSettings = {
    app: {
        placement: 'left',
        "toast.max": toast_max,
        "toast.timeout": toast_timeout,

        /* General settings */
        "settings.store_timeout": settings_store_timeout,
        "search.delay": search_delay,

        "i_am_developer": false,

        "query_history.max_items": 10000,
        "query_history.max_age_days": 90,
        "query_history.compress_text": true,
        "query_history.deduplicate_mode": "time-based",
        "query_history.deduplicate_time_window": 60, // 1 minute
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

settingsRegistry.register((context) => {
    const t = i18next.t.bind(i18next);

    context.registerCollection({
        key: 'app',
        title: t('application-settings', 'Application Settings'),
        description: t('application-settings-description', 'Settings related to the application behavior and appearance.'),
        groups: [{
            key: 'general',
            title: t('general-settings', 'General Settings'),
            description: t('general-settings-description', 'Settings that apply to the entire application.'),
            settings: [
                {
                    type: 'number',
                    storageGroup: 'app',
                    storageKey: 'settings.store_timeout',
                    label: t('settings.store-timeout', 'Settings Store Timeout'),
                    description: t('settings.store-timeout-description', 'Timeout for storing settings in milliseconds.'),
                    category: t('behavior', 'Behavior'),
                    min: 100,
                    max: 10000,
                    step: 100,
                },
                {
                    type: 'number',
                    storageGroup: 'app',
                    storageKey: 'search.delay',
                    label: t('search.delay', 'Search Delay'),
                    description: t('search.delay.description', 'Delay for search input in milliseconds.'),
                    category: t('behavior', 'Behavior'),
                    min: 100,
                    max: 10000,
                    step: 100,
                },
            ],
        },
        {
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
        },
        {
            key: 'query-history',
            title: t('query-history-settings', 'Query History Settings'),
            description: t('query-history-settings-description', 'Settings related to the query history management.'),
            settings: [
                {
                    type: 'number',
                    storageGroup: 'app',
                    storageKey: 'query_history.max_items',
                    label: t('query-history-max-items', 'Maximum Query History Items'),
                    description: t('query-history-max-items-description', 'Maximum number of query history items to store.'),
                    min: 100,
                    max: 10000,
                    step: 100,
                },
                {
                    type: 'number',
                    storageGroup: 'app',
                    storageKey: 'query_history.max_age_days',
                    label: t('query-history-max-age-days', 'Maximum Query History Age (Days)'),
                    description: t('query-history-max-age-days-description', 'Maximum age of query history items in days.'),
                    min: 1,
                    max: 365,
                    step: 7,
                },
                {
                    type: 'boolean',
                    storageGroup: 'app',
                    storageKey: 'query_history.compress_text',
                    label: t('query-history-compress-text', 'Compress Query Text'),
                    description: t('query-history-compress-text-description', 'Enable compression of query text in the history. Removes unnecessary spaces and new lines.'),
                },
                {
                    type: 'select',
                    storageGroup: 'app',
                    storageKey: 'query_history.deduplicate_mode',
                    label: t('query-history-deduplicate-mode', 'Query History Deduplication Mode'),
                    description: t('query-history-deduplicate-mode-description', 'Determines how duplicate queries are handled in the history.'),
                    options: [
                        { 
                            value: "none", 
                            label: t('deduplication-none', 'None'), 
                            description: t('deduplication-none-description', 'All queries are stored. Useful for comparing execution times of the same query.') 
                        },
                        { 
                            value: "time-based", 
                            label: t('deduplication-time-based', 'Time-based'), 
                            description: t('deduplication-time-based-description', 'Keeps all queries within the time window (for performance testing), older duplicates are reduced to one historical entry.') 
                        },
                        { 
                            value: "aggressive", 
                            label: t('deduplication-aggressive', 'Aggressive'), 
                            description: t('deduplication-aggressive-description', 'Keeps only the most recent execution of each unique query. Minimizes storage but loses execution history.') 
                        },
                    ],
                },
                {
                    type: 'number',
                    storageGroup: 'app',
                    storageKey: 'query_history.deduplicate_time_window',
                    label: t('query-history-deduplicate-time-window', 'Deduplication Time Window (seconds)'),
                    description: t('query-history-deduplicate-time-window-description', 'Time window in seconds during which all duplicate queries are preserved. After this window, only one historical entry is kept per query. Useful for comparing cold vs cached query performance.'),
                    min: 1,
                    max: 600,
                    step: 1,
                },
            ],
        }
        ],
    });

    context.registerCollection({
        key: 'dborg',
        title: t('orbada-settings', 'Orbada Settings'),
        description: t(
            'orbada-settings-description',
            'Settings related to the Orbada database management. That is, settings concerning elements that display and process data.'
        ),
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

    context.registerCollection({
        key: 'developer',
        title: t('developer-options', "I'm a Developer!"),
        description: t('developer-options-description', 'Settings related to developer options.'),
        settings: [
            {
                type: 'boolean',
                storageGroup: 'app',
                storageKey: 'i_am_developer',
                label: t('i-am-developer', 'I am a developer'),
                description: t('i-am-developer-description', 'Enable developer options and features.'),
                category: t('developer', 'Developer'),
            }
        ]
    });
});
