import { SettingTypeEmail } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { validateEmail, validateStringLength } from "./validations";
import React from "react";
import { getSettingDefault, useSetting } from "@renderer/contexts/SettingsContext";

export const EmailSetting: React.FC<{
    setting: SettingTypeEmail;
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
            validate={(value: string) => 
                validateEmail(
                    value,
                    () => validateStringLength(value, setting.minLength, setting.maxLength)
                )}
            policy={() => setting.maxLength ? `${(value ?? "").length} / ${setting.maxLength}` : undefined}
        >
            <BaseTextField
                id={`SettingEditor-${setting.storageGroup}-${setting.key}`}
                type="email"
                sx={{
                    width: calculateWidth(setting)
                }}
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