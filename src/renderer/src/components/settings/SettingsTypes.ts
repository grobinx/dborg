import React from "react";
import { ColorPickerType } from "../useful/ColorPicker";

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
    /**
     * An array input.
     */
    | "array"
    /**
     * A rendered setting, which is used for custom components that render the setting in a specific way.
     */
    | "rendered"

export interface SettingTypeBase {
    type: SettingType;
    /**
     * A group of the setting.
     * This is a file name in %HOME%/.dborg/settings catalog.
     */
    storageGroup: string;
    /**
     * A key for the setting.
     */
    key: string;
    /**
     * Optional group for categorization of settings.
     * This will be placed before title in the UI.
     */
    category?: string;
    /**
     * The title of the setting, displayed in the UI.
     * This should be a user-friendly name that describes the setting.
     */
    label: string;
    /**
     * A description of the setting, displayed in the UI.
     * This should provide additional context or instructions for the user.
     * It can be a string or a React node for more complex content.
     * String descriptions will be rendered as markdown.
     */
    description?: React.ReactNode;
    /**
     * Default value for the setting, type depends on the setting type
     * For example, for a string setting, this would be a string.
     * For a boolean setting, this would be a boolean.
     */
    defaultValue?: any;
    /**
     * Width of the setting in the UI.
     * This can be a number (in pixels) or a string (e.g., "100%").
     * If not specified, the width will be determined by the type of setting.
     */
    width?: number | string; 
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
    disabled?: boolean | (() => boolean);
    /**,
     * Whether the setting is administrated.
     * If true, the setting is administrated and cannot be changed by the user.
     */
    administrated?: boolean | (() => boolean);
    /**
     * A function to validate the value of the setting.
     * It should return a string with an error message if the value is invalid,
     * or true if the value is valid.
     * String will be rendered as markdown.
     * @param value - the current value of the setting
     * @param values - all values of the settings
     */
    validate?: (value: any) => string | boolean;
    /**
     * This is dynamic description used in the UI to show the descriptive effect of the setting.
     * Return value can be a string or a React node for more complex content.
     * String will be rendered as markdown.
     */
    effect?: () => React.ReactNode;
    /**
     * A function that is called when the value of the setting changes.
     * This can be used to perform additional actions when the setting value changes and store.
     * @param value - the current value of the setting
     * @param values - all values of the settings
     * @returns 
     */
    changed?: (value: any) => void;
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
    /**
     * Visible number of rows for the text area.
     * Default is 4.
     */
    rows?: number;
    /**
     * Minimum number of rows for the text area.
     */
    minRows?: number;
    /**
     * Maximum number of rows for the text area.
     */
    maxRows?: number;
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
    /**
     * At least one uppercase letter (?=.*[A-Z])
     */
    atLeastOneUppercase?: boolean;
    /**
     * At least one lowercase letter (?=.*[a-z])
     */
    atLeastOneLowercase?: boolean;
    /**
     * At least one digit (?=.*[0-9])
     */
    atLeastOneDigit?: boolean;
    /**
     * At least one special character (?=.*[!@#$%^&*])
     */
    atLeastOneSpecialChar?: boolean;
    /**
     * Special characters that are allowed in the password.
     * If not specified, defaults to "!@#$%^&*()_+-=[]{}|;':\",.<>?/"
     */
    specialChars?: string;
    /**
     * If true, the password cannot contain spaces.
     */
    noSpaces?: boolean;
    /**
     * Whether the password can be generated by the user.
     * If true, a button will be displayed to generate a random password.
     */
    canGenerate?: boolean;
    /**
     * Hash the password using a secure hashing algorithm.
     * @param value The password to hash.
     * @returns The hashed password.
     */
    hash?: (value: string) => string;
}

export interface SettingTypeEmail extends SettingTypeStringBase {
    type: "email";
}

export interface SettingTypeNumber extends SettingTypeBase {
    type: "number";
    defaultValue?: number;
    min?: number;
    max?: number;
    step?: number;
}

export interface SelectOption {
    label: React.ReactNode;
    value: string | number | bigint | boolean;
    description?: React.ReactNode;
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
    picker?: ColorPickerType;
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
    minDistance?: number;
    defaultValue?: [number, number];
}

export interface SettingTypeArray extends SettingTypeBase {
    type: "array";
    /**
     * Type of items in the array
     * Default is "string"
     */
    itemType?: Extract<SettingType, "string" | "number" | "email" | "filePath" | "directoryPath" | "color">;
    defaultValue?: string[]; // Default value for the array
}

export interface SettingTypeRendered extends SettingTypeBase {
    type: "rendered";
    /**
     * A React component that will render the setting.
     * This allows for custom rendering of the setting.
     * @props value - the current value of the setting
     * @props onChange - a function to call when the value changes
     * @props values - all values of the settings
     */
    render: React.FC<{ value: any; onChange: (value: any) => void; values: Record<string, any> }>;
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
    | SettingTypeRendered
    | SettingTypeArray
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
