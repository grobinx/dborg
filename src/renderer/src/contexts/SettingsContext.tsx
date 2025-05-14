import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { TSettings } from "src/api/settings";

export type SettingsContextType = {
    settings: Record<string, TSettings>;
    updateSettings: <T extends TSettings>(name: string, key: keyof T, value: T[keyof T]) => void;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

/**
 * Initialize settings by loading all known settings groups.
 * This function should be called before rendering the provider.
 */
export const initializeSettings = async (defaultSettings: Record<string, TSettings> = {}): Promise<Record<string, TSettings>> => {
    const allSettings = await Promise.all(
        Object.keys(defaultSettings).map(async (group) => ({
            [group]: {
                ...defaultSettings[group],
                ...(await window.dborg.settings.get(group)),
            },
        }))
    );
    return allSettings.reduce((acc, groupSettings) => ({ ...acc, ...groupSettings }), {});
};

export const SettingsProvider: React.FC<{ children: React.ReactNode, settings: Record<string, TSettings> }> = (props) => {
    const [settings, setSettings] = useState<Record<string, TSettings>>(props.settings);
    const [changedGroups, setChangedGroups] = useState<Set<string>>(new Set()); // Track changed groups

    // Automatically save changed groups after 1 second
    useEffect(() => {
        if (changedGroups.size > 0) {
            const timer = setTimeout(async () => {
                for (const group of changedGroups) {
                    window.dborg.settings.store(group, settings[group]);
                }
                setChangedGroups(new Set()); // Clear the changed groups after saving
            }, Number(settings?.app?.store_settings_timeout) ?? 1000);

            return () => clearTimeout(timer); // Clear timeout if dependencies change
        }

        return;
    }, [changedGroups]);

    // Update settings for a specific group and allow setting a single value
    const updateSettings = useCallback(
        <T extends TSettings>(name: string, key: keyof T, value: T[keyof T]) => {
            setSettings((prev) => {
                const currentValue = (prev[name] as T)?.[key];
                if (currentValue === value) {
                    return prev; // Do not update if the value hasn't changed
                }
                const updatedSettings = {
                    ...prev,
                    [name]: { ...prev[name], [key]: value },
                };
                setChangedGroups((prevChanged) => new Set(prevChanged).add(name)); // Mark group as changed
                return updatedSettings;
            });
        },
        []
    );

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {props.children}
        </SettingsContext.Provider>
    );
};

export const useSettings = <T extends TSettings>(name: string): readonly [T, (key: keyof T, value: T[keyof T]) => void] => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }

    return [
        /**
         * Get the settings for a specific group.
         */
        (context.settings[name] || {}) as T,
        /**
         * Update a specific setting in the group.
         * @param key The key of the setting to update.
         * @param value The new value for the setting.
         */
        (key: keyof T, value: T[keyof T]) => context.updateSettings<T>(name, key as string, value),
    ];
};

