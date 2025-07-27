import { AppSettings } from "@renderer/app.config";
import definitions, { EditableSettingsRegistry } from "@renderer/components/settings/EditableSettingsRegistry";
import { group } from "console";
import React, { createContext, useContext, useEffect, useState } from "react";
import { TSettings } from "src/api/settings";
import { produce } from "immer";

// Globalna zmienna przechowująca listę nazw ustawień oraz ich domyślne wartości
export const SETTINGS_NAMES: Record<string, TSettings> = {
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
    definitions: EditableSettingsRegistry;
}

// Domyślna wartość kontekstu
export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Mechanizm debouncing dla zapisu ustawień
const debounceMap: Record<string, NodeJS.Timeout> = {};

/**
 * Hook `useSettings` pozwala na dostęp do ustawień dla określonej grupy oraz ich aktualizację.
 * Można aktualizować pojedynczy klucz lub część/całą strukturę ustawień.
 *
 * @example
 * 
 * interface UserSettings {
 *     theme: string;
 *     notificationsEnabled: boolean;
 * }
 *
 * const App: React.FC = () => {
 *     const [userSettings, updateUserSetting] = useSettings<UserSettings>("user");
 *
 *     const handleThemeChange = () => {
 *         updateUserSetting("theme", "dark");
 *     };
 *
 *     const handleNotificationsChange = () => {
 *         updateUserSetting("notificationsEnabled", true);
 *     };
 *
 *     const handleUpdateStructure = () => {
 *         updateUserSetting({
 *             theme: "light",
 *             notificationsEnabled: false,
 *         });
 *     };
 *
 *     return (
 *         <div>
 *             <h1>Ustawienia użytkownika</h1>
 *             <pre>{JSON.stringify(userSettings, null, 2)}</pre>
 *             <button onClick={handleThemeChange}>Zmień motyw</button>
 *             <button onClick={handleNotificationsChange}>Włącz powiadomienia</button>
 *             <button onClick={handleUpdateStructure}>Zaktualizuj całą strukturę</button>
 *         </div>
 *     );
 * };
 *
 * @param settingsName Nazwa grupy ustawień, dla której chcemy uzyskać dostęp.
 * @returns Tablica zawierająca:
 * - Obiekt ustawień dla określonej grupy.
 * - Funkcję do aktualizacji ustawień (pojedynczego klucza lub całą strukturę).
 */
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
    defaultValue: T
): [T, (value: T) => void] => {
    const context = useContext(SettingsContext);

    if (!context) {
        throw new Error("useSetting must be used within a SettingsProvider");
    }

    // Wyciągnij wartość ustawienia i użyj useMemo, aby stabilizować referencję
    const value =  (context.settings[group]?.[key] ?? defaultValue) as T;
    const setValue = React.useCallback(
        (newValue: T) => {
            context.setSetting(group, key, newValue);
        },
        [context, group, key]
    );

    return [value, setValue];
};

// Provider kontekstu ustawień
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Record<string, TSettings>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Funkcja do odczytu ustawień z plików
    const loadSettings = async () => {
        const loadedSettings: Record<string, TSettings> = {};
        for (const name in SETTINGS_NAMES) {
            try {
                const fileSettings = await window.dborg.settings.get(name);
                loadedSettings[name] = fileSettings || SETTINGS_NAMES[name]; // Użyj domyślnych ustawień, jeśli brak danych
            } catch (error) {
                console.error(`Nie udało się odczytać ustawień z pliku: ${name}`, error);
                loadedSettings[name] = SETTINGS_NAMES[name]; // Użyj domyślnych ustawień w przypadku błędu
            }
        }
        setIsLoading(false);
        setSettings(loadedSettings);
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
        }, (settings["app"] as AppSettings).settings.store_timeout);
    };

    // Funkcja do zmiany ustawień z debouncing
    const updateSettings = async <T extends TSettings>(name: string, newSettings: T) => {
        // Aktualizuj lokalne ustawienia
        setSettings((prev) => ({
            ...prev,
            [name]: newSettings,
        }));

        storeGroups(name, newSettings);
    };

    const setSetting = <T = string>(group: string, key: string, value: T): void => {
        setSettings((prev) =>
            produce(prev, (draft) => {
                if (!draft[group]) {
                    draft[group] = {}; // Upewnij się, że grupa istnieje
                }

                // Porównaj starą i nową wartość
                if (draft[group][key] !== value) {
                    draft[group][key] = value; // Zaktualizuj tylko, jeśli wartość się zmieniła
                }
            })
        );

        // Wywołaj storeGroups, aby zapisać zmiany na dysku
        storeGroups(group, {
            ...settings[group],
            [key]: value,
        });
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
                definitions,
                setSetting
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};