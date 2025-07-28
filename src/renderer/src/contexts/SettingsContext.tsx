import { AppSettings } from "@renderer/app.config";
import React, { createContext, useContext, useEffect, useState } from "react";
import { TSettings } from "src/api/settings";

const settings: Record<string, TSettings> = {};
const subscribers: Record<string, Record<string, ((value: any) => void)[]>> = {};

// Globalna zmienna przechowująca listę nazw ustawień oraz ich domyślne wartości
export const SETTINGS_NAMES: Record<string, Record<string, any>> = {
    // default: { theme: "light", notificationsEnabled: true },
    // user: { theme: "dark", notificationsEnabled: false },
    // app: { version: "1.0.0", autoUpdate: true },
};

// Typ dla kontekstu ustawień
interface SettingsContextType {
    updateSettings: <T extends TSettings>(name: string, newSettings: T) => Promise<void>;
    setSetting: <T = string>(group: string, key: string, value: T) => void;
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

// Domyślna wartość kontekstu
export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Mechanizm debouncing dla zapisu ustawień
const debounceMap: Record<string, NodeJS.Timeout> = {};

export const useSettings = <T extends TSettings>(
    settingsName: string,
): readonly [
    T,
    (keyOrStructure: keyof T | Partial<T>, value?: T[keyof T]) => void
] => {
    const context = useContext(SettingsContext);

    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }

    return [
        /**
         * Pobierz ustawienia dla określonej grupy.
         */
        (context.settings[settingsName] || {}) as T,
        /**
         * Zaktualizuj ustawienia dla określonej grupy.
         * Jeśli przekazano klucz i wartość, aktualizuje tylko ten klucz.
         * Jeśli przekazano strukturę, aktualizuje wszystkie klucze w strukturze.
         * @param keyOrStructure Klucz ustawienia lub struktura ustawień.
         * @param value Nowa wartość dla klucza (opcjonalne, używane tylko przy aktualizacji pojedynczego klucza).
         */
        (keyOrStructure: keyof T | Partial<T>, value?: T[keyof T]) => {
            const currentSettings = context.settings[settingsName] || {};
            let updatedSettings: T;

            if (typeof keyOrStructure === "object") {
                // Aktualizacja na podstawie struktury
                updatedSettings = {
                    ...currentSettings,
                    ...keyOrStructure,
                } as T;
            } else {
                // Aktualizacja pojedynczego klucza
                updatedSettings = {
                    ...currentSettings,
                    [keyOrStructure]: value,
                } as T;
            }

            context.updateSettings<T>(settingsName, updatedSettings);
        },
    ];
};

export const useSetting = <T = string>(
    group: string,
    key: string,
    defaultValue?: T
): [T, (value: T) => void] => {
    const context = useContext(SettingsContext);

    if (!context) {
        throw new Error("useSetting must be used within a SettingsProvider");
    }

    const [value, setValue] = useState<any>(context?.settings[group]?.[key] ?? defaultValue ?? SETTINGS_NAMES[group]?.[key]);

    React.useEffect(() => {
        const unsubscribe = subscribeChange(group, key, (value) => setValue(value));

        return () => {
            unsubscribe();
        };
    }, [group, key]);

    const setSettingValue = (newValue: T) => {
        context.setSetting(group, key, newValue);
    };

    return [value, setSettingValue];
};

// Provider kontekstu ustawień
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);

    // Funkcja do odczytu ustawień z plików
    const loadSettings = async () => {
        for (const name in SETTINGS_NAMES) {
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
        }, settings["app"]["settings.store_timeout"] ?? SETTINGS_NAMES["app"]["settings.store_timeout"]);
    };

    // Funkcja do zmiany ustawień z debouncing
    const updateSettings = async <T extends TSettings>(name: string, newSettings: T) => {
        // Aktualizuj lokalne ustawienia
        settings[name] = newSettings;
        storeGroups(name, newSettings);
    };

    const setSetting = (group: string, key: string, value: any): void => {
        if (settings[group][key] !== value) {
            settings[group][key] = value;

            notifyChange(group, key, value);

            // Wywołaj storeGroups, aby zapisać zmiany na dysku
            storeGroups(group, {
                ...settings[group],
            });
        }
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
                updateSettings,
                settings,
                isLoading,
                setSetting
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};