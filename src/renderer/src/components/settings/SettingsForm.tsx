import React from "react";
import { SettingType, SettingTypeUnion } from "./SettingsTypes";
import { useSetting } from "@renderer/contexts/SettingsContext";
import { SettingDecorator } from "./SettingDecorator";
import { TextField } from "../inputs/TextField";
import { calculateWidth } from "./SettingInputControl";
import { NumberField } from "../inputs/NumberField";

function useSettingBinding(setting: SettingTypeUnion) {
    const [settingValue, setSettingValue, defaultValue] = useSetting(setting.storageGroup, setting.key, setting.defaultValue);
    const [value, setValue] = React.useState<any>(settingValue);

    React.useEffect(() => {
        setValue(settingValue);
    }, [setting.storageGroup, setting.key, settingValue]);

    const fieldSetValue = React.useCallback((value: any) => {
        setValue(value);
    }, [setting]);

    const fieldValueChanged = React.useCallback((value: any) => {
        setSettingValue(value);
        setting.changed?.(value);
    }, [setting, setSettingValue]);

    return [value, fieldSetValue, fieldValueChanged, defaultValue] as const;
}

const StringSetting: React.FC<{ setting: Extract<SettingTypeUnion, { type: "string" }> }> = ({ setting }) => {
    const [value, onChange, onChanged] = useSettingBinding(setting);

    return (
        <SettingDecorator setting={setting} value={value} setValue={onChange}>
            <TextField 
                value={value} 
                onChange={onChange} 
                onChanged={onChanged}
                width={calculateWidth(setting)}
                required={setting.required}
                maxLength={setting.maxLength} 
                minLength={setting.minLength} 
            />
        </SettingDecorator>
    );
};

const NumberSetting: React.FC<{ setting: Extract<SettingTypeUnion, { type: "number" }> }> = ({ setting }) => {
    const [value, onChange, onChanged] = useSettingBinding(setting);
    return (
        <SettingDecorator setting={setting} value={value} setValue={onChange}>
            <NumberField
                value={value}
                onChange={onChange}
                onChanged={onChanged}
                width={calculateWidth(setting)}
                required={setting.required}
                min={setting.min}
                max={setting.max}
                step={setting.step}
            />
        </SettingDecorator>
    );
};

const registry: Partial<Record<SettingType, React.FC<{ setting: any }>>> = {
    string: ({ setting }) => <StringSetting setting={setting} />,
    number: ({ setting }) => <NumberSetting setting={setting} />,
};

export const SettingItem: React.FC<{ setting: SettingTypeUnion }> = ({ setting }) => {
    const Renderer = registry[setting.type];

    if (!Renderer) {
        return <>Unsupported setting type: {setting.type}</>;
    }

    return <Renderer setting={setting} />;
};
