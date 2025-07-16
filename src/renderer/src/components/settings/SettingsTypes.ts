
export type SettingType = 
    /**
     * A boolean setting.
     */
    | "boolean"
    /**
     * A single-line text input.
     */
    | "string"
    /**
     * A multi-line text input.
     */
    | "text"
    /**
     * A pattern input, eg [a-zA-Z0-9]+.
     */
    | "pattern"
    /**
     * A password input.
     */
    | "password"
    /**
     * A email input.
     */
    | "email"
    /**
     * A numeric input.
     */
    | "number"
    /**
     * A single-select dropdown.
     */
    | "select"
    /**
     * A multi-select dropdown.
     */
    | "multiselect"
    /**
     * A JSON object input.
     */
    | "json"
    /**
     * A color picker input.
     */
    | "color"
    /**
     * A file path input.
     */
    | "filePath"
    /**
     * A directory path input.
     */
    | "directoryPath"
    /**
     * A date input.
     */
    | "date"
    /**
     * A time input.
     */
    | "time"
    /**
     * A datetime input.
     */
    | "datetime"
    /**
     * A value range input (number).
     */
    | "range"

interface SettingTypeBase {
    type: SettingType;
    /**
     * A unique key for the setting.
     */
    key: string;
    /**
     * The title of the setting, displayed in the UI.
     * This should be a user-friendly name that describes the setting.
     */
    title: string;
    /**
     * A description of the setting, displayed in the UI.
     * This should provide additional context or instructions for the user.
     */
    description?: string;
    /**
     * Tags for the setting, used for filtering.
     */
    tags?: string[];
    /**
    * Does the setting relate to experimental functionality.
    * If true, the setting is experimental and may not be fully stable.
    */
    experimental?: boolean;
    /**
     * Does the setting relate to advanced functionality.
     */
    advanced?: boolean;
    /**
     * Settings are required.
     */
    required?: boolean;
    /**
    * Whether the setting is disabled.
    * If true, the setting is disabled and cannot be changed by the user.
    * You can make this dependent on the values of other settings by passing a function.
    */
    disabled?: boolean | ((values: Record<string, any>) => boolean);
    /**,
     * Whether the setting is administrated.
     * If true, the setting is administrated and cannot be changed by the user.
     */
    administrated?: boolean | (() => boolean);
    /**
     * A function to validate the value of the setting.
     * It should return a string with an error message if the value is invalid,
     * or true if the value is valid.
     * @param value - the current value of the setting
     * @param values - all values of the settings
     */
    validate?: (value: any, values: Record<string, any>) => string | boolean;
    /**
     * This is dynamic desciption used in the UI to show the effect of the setting.
     * @param value - the current value of the setting
     * @param values - all values of the settings
     */
    effect?: (values: Record<string, any>) => string;
}

export interface SettingTypeBoolean extends SettingTypeBase {
    type: "boolean";
    defaultValue?: boolean;
}

export interface SettingTypeStringBase extends SettingTypeBase {
    maxLength?: number;
    minLength?: number;
    defaultValue?: string;
}

export interface SettingTypeString extends SettingTypeStringBase {
    type: "string";
}

export interface SettingTypeText extends SettingTypeStringBase {
    type: "text";
    maxLines?: number;
}

export interface SettingTypePattern extends SettingTypeBase {
    type: "pattern";
    /**
     * Pattern mask 
     * e.g. "dd.mm.yyyy"
     * e.g. "+0 (___) ___-__-__"
     */
    mask: string;
    /**
     * Replacement patterns for the mask.
     * e.g. { "d": /\d/, "m": /\d/, "y": /\d/ }
     * e.g. { "_": /\d/ }
     */
    replacement: Record<string, RegExp>;
    defaultValue?: string;
}

export interface SettingTypePassword extends SettingTypeStringBase {
    type: "password";
    defaultValue?: string;
}

export interface SettingTypeEmail extends SettingTypeStringBase {
    type: "email";
    defaultValue?: string;
}

export interface SettingTypeNumber extends SettingTypeBase {
    type: "number";
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
}

export interface SelectOption {
    label: string;
    value: string | number | bigint | boolean;
    description?: string;
}

export interface SettingTypeSelectBase extends SettingTypeBase {
    options: SelectOption[];
}

export interface SettingTypeSelect extends SettingTypeSelectBase {
    type: "select";
    defaultValue?: string | number | bigint | boolean;
}

export interface SettingTypeMultiSelect extends SettingTypeSelectBase {
    type: "multiselect";
    defaultValue?: (string | number | bigint | boolean)[];
}

export interface SettingTypeJson extends SettingTypeBase {
    type: "json";
    defaultValue?: Record<string, any>;
}

export interface SettingTypeColor extends SettingTypeBase {
    type: "color";
    defaultValue?: string; // Hex color code
}

export interface SettingTypeFilePath extends SettingTypeBase {
    type: "filePath";
    allowedFormats?: string[]; // e.g., ["jpg", "png", "gif"]
    defaultValue?: string;
}

export interface SettingTypeDirectoryPath extends SettingTypeBase {
    type: "directoryPath";
    defaultValue?: string;
}

export interface SettingTypeDate extends SettingTypeBase {
    type: "date";
    defaultValue?: string; // ISO date string
}

export interface SettingTypeTime extends SettingTypeBase {
    type: "time";
    defaultValue?: string; // ISO time string
}

export interface SettingTypeDateTime extends SettingTypeBase {
    type: "datetime";
    defaultValue?: string; // ISO datetime string
}

export interface SettingTypeRange extends SettingTypeBase {
    type: "range";
    min: number;
    max: number;
    step?: number;
    defaultValue?: { start: number, end: number };
}

export type SettingTypeUnion =
    | SettingTypeBoolean
    | SettingTypeString
    | SettingTypeText
    | SettingTypePattern
    | SettingTypePassword
    | SettingTypeEmail
    | SettingTypeNumber
    | SettingTypeSelect
    | SettingTypeMultiSelect
    | SettingTypeJson
    | SettingTypeColor
    | SettingTypeFilePath
    | SettingTypeDirectoryPath
    | SettingTypeDate
    | SettingTypeTime
    | SettingTypeDateTime
    | SettingTypeRange
    ;

/**
 * Represents a settings group in the application.
 * Directly related to a specific structure in the settings file.
 */
export interface SettingsGroup {
    /**
     * A unique key for the settings group.
     */
    key: string;
    title: string;
    description?: string;
    settings: SettingTypeUnion[];
    /**
     * Optional sub-groups within this group.
     * This allows for nested settings structures.
     */
    groups?: SettingsGroup[];
}

/**
 * Represents a collection of settings in the application.
 * Directly related to a settings file name in %HOME%/.dborg/settings catalog.
 */
export interface SettingsCollection {
    /**
     * A unique key for the settings collection.
     * This key is used to identify the settings collection.
     * It can be used to load or save the settings collection with TSettings and SettingsContext.
     */
    key: string;
    title: string;
    description?: string;
    groups?: SettingsGroup[];
    /**
     * Optional settings directly related to this collection (root).
     * These settings are not part of any specific group.
     */
    settings?: SettingTypeUnion[];
}
