import { AppSettings } from "@renderer/app.config";
import React, { createContext, useContext, useEffect, useState } from "react";
import { TSettings } from "src/api/settings";

const settings: Record<string, TSettings> = {};
const subscribers: Record<string, Record<string, ((value: any) => void)[]>> = {};
const debounceMap: Record<string, NodeJS.Timeout> = {};

/**
 * Global variable storing the list of setting names and their default values
 */
export const settingsGroupDefaults: Record<string, Record<string, any>> = {
    // default: { theme: "light", notificationsEnabled: true },
    // user: { theme: "dark", notificationsEnabled: false },
    // app: { version: "1.0.0", autoUpdate: true },
};

// Typ dla kontekstu ustawień
interface SettingsContextType {
    settings: Record<string, TSettings>;
    isLoading: boolean;
}

const subscribeChange = (group: string, key: string, callback: (value: any) => void): (() => void) => {
    if (!subscribers[group]) {
        subscribers[group] = {};
    }
    if (!subscribers[group][key]) {
        subscribers[group][key] = [];
    }

    subscribers[group][key].push(callback);

    // Zwracamy funkcję do odsubskrybowania
    return () => {
        subscribers[group][key] = subscribers[group][key].filter((cb) => cb !== callback);
        if (subscribers[group][key].length === 0) {
            delete subscribers[group][key];
        }
        if (Object.keys(subscribers[group]).length === 0) {
            delete subscribers[group];
        }
    };
};

const notifyChange = (group: string, key: string, value: any) => {
    const keySubscribers = subscribers[group]?.[key];
    if (keySubscribers) {
        setTimeout(() => {
            keySubscribers.forEach((callback) => callback(value));
        });
    }
};

const storeGroups = (name: string, newSettings: TSettings) => {
    // Debouncing zapisu na dysku
    if (debounceMap[name]) {
        clearTimeout(debounceMap[name]);
    }

    debounceMap[name] = setTimeout(async () => {
        try {
            window.dborg.settings.store(name, newSettings);
            delete debounceMap[name]; // Usuń z debounceMap po zapisaniu
        } catch (error) {
            console.error(`Nie udało się zapisać ustawień dla: ${name}`, error);
        }
    }, settings["app"]["settings.store_timeout"] ?? settingsGroupDefaults["app"]["settings.store_timeout"]);
};

export const setSetting = (group: string, key: string, value: any): void => {
    if (settings[group][key] !== value) {
        settings[group][key] = value;

        notifyChange(group, key, value);

        // Wywołaj storeGroups, aby zapisać zmiany na dysku
        storeGroups(group, {
            ...settings[group],
        });
    }
};

export const getSettingDefault = (group: string, key: string, defaultValue?: any): any => {
    if (!defaultValue && settingsGroupDefaults[group] && key in settingsGroupDefaults[group]) {
        return settingsGroupDefaults[group][key];
    }
    return defaultValue;
};

export const getSetting = (group: string, key: string, defaultValue?: any): any => {
    if (settings[group] && key in settings[group]) {
        return settings[group][key] ?? defaultValue ?? settingsGroupDefaults[group]?.[key];
    }
    return defaultValue ?? settingsGroupDefaults[group]?.[key];
};

// Domyślna wartość kontekstu
export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Hook for managing a single setting.
 * @param group Settings group.
 * @param key Setting key.
 * @param defaultValue Default value for the setting.
 * @returns An array containing the setting value, a function to update it, and the default value.
 */
export const useSetting = <T = string>(
    group: string,
    key: string,
    defaultValue?: T
): [T, (value: T) => void, T] => {
    const [value, setValue] = useState<any>(settings[group]?.[key] ?? defaultValue ?? settingsGroupDefaults[group]?.[key]);

    React.useEffect(() => {
        const unsubscribe = subscribeChange(group, key, (value) => {
            setValue(value ?? defaultValue ?? settingsGroupDefaults[group]?.[key]);
        });

        return () => {
            unsubscribe();
        };
    }, [group, key]);

    const setSettingValue = (newValue: T) => {
        setSetting(group, key, newValue);
    };

    return [value, setSettingValue, defaultValue ?? settingsGroupDefaults[group]?.[key]];
};

// Provider kontekstu ustawień
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);

    // Funkcja do odczytu ustawień z plików
    const loadSettings = async () => {
        for (const name in settingsGroupDefaults) {
            try {
                const fileSettings = await window.dborg.settings.get(name);
                settings[name] = fileSettings || {};
            } catch (error) {
                console.error(`Nie udało się odczytać ustawień z pliku: ${name}`, error);
                settings[name] = {};
            }
        }
        setIsLoading(false);
    };

    // Inicjalizacja ustawień podczas montowania komponentu
    useEffect(() => {
        loadSettings();

        // Cleanup: zapisanie zmienionych ustawień przy odmontowaniu kontekstu
        return () => {
            Object.keys(debounceMap).forEach(async (name) => {
                try {
                    clearTimeout(debounceMap[name]);
                    window.dborg.settings.store(name, settings[name]);
                    delete debounceMap[name]; // Usuń z debounceMap po zapisaniu
                } catch (error) {
                    console.error(`Nie udało się zapisać ustawień dla: ${name}`, error);
                }
            });
        };
    }, []);

    return (
        <SettingsContext.Provider
            value={{
                settings,
                isLoading,
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};