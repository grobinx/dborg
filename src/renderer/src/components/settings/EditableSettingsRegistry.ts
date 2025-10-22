import { SettingsCollection, SettingsGroup, SettingTypeUnion } from "./SettingsTypes";

export type RegistrationFunctionContext = {
    /**
     * Registers a new settings collection.
     * @param collection The settings collection to register.
     */
    registerCollection: (collection: SettingsCollection) => void;

    /**
     * Registers a new settings group.
     * @param collectionKey The key of the collection to which the group belongs.
     * @param group The settings group to register.
     */
    registerGroup: (collectionKey: string, group: SettingsGroup) => void;

    /**
     * Registers a new setting.
     * @param collectionKey The key of the collection to which the setting belongs.
     * @param groupKey The key of the group to which the setting belongs (optional). If not provided, the setting is added directly to the collection root.
     * @param setting The setting to register.
     */
    registerSetting: (collectionKey: string, groupKey: string | undefined, setting: SettingTypeUnion) => void;
};

export class EditableSettingsRegistry {
    private collections: SettingsCollection[] = [];

    private registrationFunctions: ((context: RegistrationFunctionContext) => void)[] = []; // Przechowuje funkcje rejestrujące

    getCollections(): SettingsCollection[] {
        return this.collections;
    }

    private registerCollection(collection: SettingsCollection): void {
        if (this.collections.some(c => c.key === collection.key)) {
            throw new Error(`Collection with key "${collection.key}" already exists.`);
        }
        this.collections.push(collection);
    }

    private registerGroup(collectionKey: string, group: SettingsGroup): void {
        const collection = this.collections.find(c => c.key === collectionKey);
        if (!collection) {
            throw new Error(`Collection with key "${collectionKey}" does not exist.`);
        }

        if (!collection.groups) {
            collection.groups = [];
        }
        if (collection.groups.some(g => g.key === group.key)) {
            throw new Error(`Group with key "${group.key}" already exists in collection "${collectionKey}".`);
        }

        collection.groups.push(group);
    }

    private registerSetting(collectionKey: string, groupKey: string | undefined, setting: SettingTypeUnion): void {
        const collection = this.collections.find(c => c.key === collectionKey);
        if (!collection) {
            throw new Error(`Collection with key "${collectionKey}" does not exist.`);
        }

        if (groupKey) {
            // Dodaj ustawienie do grupy, jeśli podano groupKey
            if (!collection.groups) {
                throw new Error(`Collection with key "${collectionKey}" does not have any groups.`);
            }
            const group = collection.groups.find(g => g.key === groupKey);
            if (!group) {
                throw new Error(`Group with key "${groupKey}" does not exist in collection "${collectionKey}".`);
            }

            if (group.settings.some(s => s.storageKey === setting.storageKey)) {
                throw new Error(`Setting with key "${setting.storageKey}" already exists in group "${groupKey}".`);
            }

            group.settings.push(setting);
        } else {
            // Dodaj ustawienie bezpośrednio do kolekcji, jeśli groupKey nie podano
            if (!collection.settings) {
                collection.settings = [];
            }
            if (collection.settings.some(s => s.storageKey === setting.storageKey)) {
                throw new Error(`Setting with key "${setting.storageKey}" already exists in collection "${collectionKey}".`);
            }

            collection.settings.push(setting);
        }
    }

    /**
     * Registers a function that will register collections, groups, and settings.
     * @param registrationFunction The function to register.
     */
    register(registrationFunction: (context: RegistrationFunctionContext) => void): void {
        this.registrationFunctions.push(registrationFunction);
    }

    /**
     * Executes all registered registration functions.
     * This should be called whenever a settings component is created.
     */
    executeRegistrations(): SettingsCollection[] {
        this.collections = [];

        const context: RegistrationFunctionContext = {
            registerCollection: this.registerCollection.bind(this),
            registerGroup: this.registerGroup.bind(this),
            registerSetting: this.registerSetting.bind(this),
        };

        for (const registrationFunction of this.registrationFunctions) {
            registrationFunction(context);
        };

        return this.collections;
    }
}

export default new EditableSettingsRegistry();
