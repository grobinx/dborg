import React from "react";
import { SettingTypePattern } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { useMask } from "@react-input/mask";
import { getSettingDefault, useSetting } from "@renderer/contexts/SettingsContext";
import { StringField } from "@renderer/components/inputs/StringField";
import { PatternField } from "@renderer/components/inputs/PatternField";

export const PatternSetting: React.FC<{
    setting: SettingTypePattern;
    onClick?: () => void;
    selected?: boolean;
}> = ({ setting, selected, onClick }) => {
    const [settingValue, setSettingValue] = useSetting<string | undefined>(setting.storageGroup, setting.key, setting.defaultValue);
    const [value, setValue] = React.useState<string | undefined>(settingValue);

    React.useEffect(() => {
        setValue(settingValue ?? getSettingDefault(setting.storageGroup, setting.key, setting.defaultValue));
    }, [settingValue]);

    return (
        <SettingInputControl
            setting={setting}
            value={value}
            setValue={(value?: any) => setValue(value)}
            onStore={(value: string) => setSettingValue(value)}
            selected={selected}
            onClick={onClick}
        >
            <PatternField
                id={`SettingEditor-${setting.storageGroup}-${setting.key}`}
                width={calculateWidth(setting)}
                mask={setting.mask}
                replacement={setting.replacement}
                value={value ?? ""}
                onChange={(value: string) => {
                    setValue(value);
                }}
                disabled={disabledControl(setting)}
                onClick={onClick}
            />
        </SettingInputControl>
    );
};