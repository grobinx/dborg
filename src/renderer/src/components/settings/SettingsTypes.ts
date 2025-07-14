
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
    title: string;
    required?: boolean;
    validate?: (value: any) => boolean;
    description?: string;
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
 * Not directly related to a specific structure in the settings file.
 * It is a group of settings that are somehow related to each other.
 */
export interface SettingsGroup {
    /**
     * A unique key for the settings group.
     */
    key: string;
    title: string;
    description?: string;
    settings: SettingTypeUnion[];
}

export interface SettingsCollection {
    /**
     * A unique key for the settings collection.
     * This key is used to identify the settings collection.
     * It can be used to load or save the settings collection with TSettings and SettingsContext.
     */
    key: string;
    title: string;
    description?: string;
    groups: SettingsGroup[];
}
