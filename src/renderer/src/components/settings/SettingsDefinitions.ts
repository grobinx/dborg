import { SettingsCollection, SettingsGroup, SettingTypeUnion } from "./SettingsTypes";

interface SettingValue {
    setting: SettingTypeUnion;
    value: any;
    onApply?: (value: any) => void;
    onReset?: () => void;
}

interface GroupValues {
    group: SettingsGroup;
    values: Record<string, any>;
    settings: Record<string, SettingValue>;
    onApply?: (values: Record<string, any>) => void;
    onReset?: () => void;
}

interface CollectionValues {
    collection: SettingsCollection;
    values: Record<string, any>;
    groups: Record<string, GroupValues>;
    onApply?: (values: Record<string, any>) => void;
    onReset?: () => void;
}

export class SettingsDefinitions {
    private collections: Map<string, CollectionValues>;

    constructor() {
        this.collections = new Map();
    }

    getCollections(): CollectionValues[] | undefined {
        return Array.from(this.collections.values());
    }

    private initializeGroupSettings(
        group: SettingsGroup,
        values: Record<string, any>,
        onApply?: (values: Record<string, any>) => void,
        onReset?: () => void
    ): Record<string, SettingValue> {
        const settings: Record<string, SettingValue> = {};
        for (const setting of group.settings) {
            settings[setting.key] = {
                setting,
                value: values[group.key]?.[setting.key],
                onApply: (value) => {
                    if (onApply) {
                        onApply({ ...values, [group.key]: { ...values[group.key], [setting.key]: value } });
                    }
                },
                onReset: () => {
                    if (onReset) {
                        onReset();
                    }
                }
            };
        }
        return settings;
    }

    private initializeGroup(
        group: SettingsGroup,
        values: Record<string, any>,
        onApply?: (values: Record<string, any>) => void,
        onReset?: () => void
    ): GroupValues {
        return {
            group,
            values: values[group.key] || {},
            settings: this.initializeGroupSettings(group, values, onApply, onReset),
            onApply: (groupValues) => {
                if (onApply) {
                    onApply({ ...values, [group.key]: groupValues });
                }
            },
            onReset: () => {
                if (onReset) {
                    onReset();
                }
            }
        };
    }

    /**
     * Registers a new settings collection.
     * @param collection The settings collection to register.
     * @param values The initial values for the settings in the collection.
     * @param onApply Callback function to be called when the settings are applied.
     * @param onReset Callback function to be called when the settings are reset.
     */
    registerCollection(
        collection: SettingsCollection, 
        values: Record<string, any>,
        onApply?: (values: Record<string, any>) => void,
        onReset?: () => void
    ): void {
        if (this.collections.has(collection.key)) {
            throw new Error(`Settings collection with key "${collection.key}" already exists.`);
        }
        const groups: Record<string, GroupValues> = {};
        for (const group of collection.groups) {
            groups[group.key] = this.initializeGroup(group, values, onApply, onReset);
        }
        this.collections.set(collection.key, {
            collection,
            values,
            groups,
            onApply,
            onReset
        });
    }

    /**
     * Registers a new settings group.
     * @param collectionKey The key of the collection to which the group belongs.
     * @param group The settings group to register.
     * @param values The initial values for the settings in the group.
     * @param onApply Callback function to be called when the settings are applied.
     * @param onReset Callback function to be called when the settings are reset.
     */
    registerGroup(
        collectionKey: string, 
        group: SettingsGroup, 
        values: Record<string, any>,
        onApply?: (values: Record<string, any>) => void,
        onReset?: () => void
    ): void {
        const collection = this.collections.get(collectionKey);
        if (!collection) {
            throw new Error(`Settings collection with key "${collectionKey}" does not exist.`);
        }
        if (collection.collection.groups.some(g => g.key === group.key)) {
            throw new Error(`Settings group with key "${group.key}" already exists in collection "${collectionKey}".`);
        }
        collection.collection.groups.push(group);
        collection.values[group.key] = values;
        collection.groups[group.key] = this.initializeGroup(group, values, onApply, onReset);
    }

    /**
     * Registers a new settings.
     * @param collectionKey The key of the collection to which the group belongs.
     * @param groupKey The key of the group to which the setting belongs.
     * @param setting The settings to register.
     * @param value The initial value for the setting.
     * @param onApply Callback function to be called when the settings are applied.
     * @param onReset Callback function to be called when the settings are reset.
     */
    registerSetting(
        collectionKey: string, 
        groupKey: string, 
        setting: SettingTypeUnion, 
        value: any,
        onApply?: (value: any) => void,
        onReset?: () => void
    ): void {
        const collection = this.collections.get(collectionKey);
        if (!collection) {
            throw new Error(`Settings collection with key "${collectionKey}" does not exist.`);
        }
        const group = collection.groups[groupKey];
        if (!group) {
            throw new Error(`Settings group with key "${groupKey}" does not exist in collection "${collectionKey}".`);
        }
        if (group.settings[setting.key]) {
            throw new Error(`Setting with key "${setting.key}" already exists in group "${groupKey}".`);
        }
        group.settings[setting.key] = {
            setting,
            value,
            onApply,
            onReset
        };
    }

}

export default new SettingsDefinitions();
