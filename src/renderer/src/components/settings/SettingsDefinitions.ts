import { ReactNode } from "react";
import { SettingsCollection, SettingsGroup, SettingTypeUnion } from "./SettingsTypes";

export class SettingsDefinitions {
    private collections: SettingsCollection[] = [];

    getCollections(): SettingsCollection[] {
        return this.collections;
    }

    /**
     * Registers a new settings collection.
     * @param collection The settings collection to register.
     */
    registerCollection(
        collection: SettingsCollection, 
    ): void {
        if (this.collections.some(c => c.key === collection.key)) {
            throw new Error(`Collection with key "${collection.key}" already exists.`);
        }
        this.collections.push(collection);
    }

    /**
     * Registers a new settings group.
     * @param collectionKey The key of the collection to which the group belongs.
     * @param group The settings group to register.
     */
    registerGroup(
        collectionKey: string, 
        group: SettingsGroup, 
    ): void {
        const collection = this.collections.find(c => c.key === collectionKey);
        if (!collection) {
            throw new Error(`Collection with key "${collectionKey}" does not exist.`);
        }

        if (collection.groups.some(g => g.key === group.key)) {
            throw new Error(`Group with key "${group.key}" already exists in collection "${collectionKey}".`);
        }

        collection.groups.push(group);
    }

    /**
     * Registers a new settings.
     * @param collectionKey The key of the collection to which the group belongs.
     * @param groupKey The key of the group to which the setting belongs.
     * @param setting The settings to register.
     */
    registerSetting(
        collectionKey: string, 
        groupKey: string, 
        setting: SettingTypeUnion, 
    ): void {
        const collection = this.collections.find(c => c.key === collectionKey);
        if (!collection) {
            throw new Error(`Collection with key "${collectionKey}" does not exist.`);
        }

        const group = collection.groups.find(g => g.key === groupKey);
        if (!group) {
            throw new Error(`Group with key "${groupKey}" does not exist in collection "${collectionKey}".`);
        }

        if (group.settings.some(s => s.key === setting.key)) {
            throw new Error(`Setting with key "${setting.key}" already exists in group "${groupKey}".`);
        }

        group.settings.push(setting);
    }

}

export default new SettingsDefinitions();
