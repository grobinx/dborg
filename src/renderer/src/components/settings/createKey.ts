import { SettingTypeUnion } from "./SettingsTypes";

function createKey(setting: SettingTypeUnion) {
    return `${setting.storageGroup}-${setting.storageKey}`;
}

export default createKey;