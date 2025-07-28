import React from "react";
import { SettingTypePattern } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { useMask } from "@react-input/mask";
import { getSettingDefault, useSetting } from "@renderer/contexts/SettingsContext";

export const PatternSetting: React.FC<{
    setting: SettingTypePattern;
    onClick?: () => void;
    selected?: boolean;
}> = ({ setting, selected, onClick }) => {
    const inputRef = useMask({ mask: setting.mask, replacement: setting.replacement, showMask: true });
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
            <BaseTextField
                id={`SettingEditor-${setting.storageGroup}-${setting.key}`}
                sx={{
                    width: calculateWidth(setting),
                    fontFamily: "monospace",
                }}
                slotProps={{
                    input: {
                        style: { fontFamily: "monospace", fontSize: "0.9em" },
                    },
                }}
                inputRef={inputRef}
                value={value ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setValue(e.target.value);
                }}
                disabled={disabledControl(setting)}
                onClick={onClick}
            />
        </SettingInputControl>
    );
};