import { SettingTypeString } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { validateStringLength } from "./validations";
import React from "react";
import { Tooltip } from "@mui/material";
import { getSettingDefault, useSetting } from "@renderer/contexts/SettingsContext";
import { StringField } from "@renderer/components/inputs/TextField";

export const StringSetting: React.FC<{
    setting: SettingTypeString;
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
            validate={(value: string) => validateStringLength(value, setting.minLength, setting.maxLength)}
            policy={() => {
                if (setting.minLength === undefined && setting.maxLength === undefined) {
                    return null;
                }
                return (
                    <Tooltip
                        title={'Min ≥ Current / Max'}
                    >
                        <div className="block">
                            {setting.minLength && `${setting.minLength} ≥ `}
                            {setting.maxLength && `${(value ?? "").length} / ${setting.maxLength}`}
                        </div>
                    </Tooltip>
                );
            }}
        >
            <StringField
                id={`SettingEditor-${setting.storageGroup}-${setting.key}`}
                width={calculateWidth(setting)}
                value={value ?? ""}
                onChange={(value: string | undefined) => {
                    setValue(value);
                }}
                disabled={disabledControl(setting)}
                onClick={onClick}
            />
        </SettingInputControl>
    );
};