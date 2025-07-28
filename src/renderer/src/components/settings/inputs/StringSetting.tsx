import { SettingTypeString } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { validateStringLength } from "./validations";
import React from "react";
import { Tooltip } from "@mui/material";
import { useSetting } from "@renderer/contexts/SettingsContext";

export const StringSetting: React.FC<{
    path: string[];
    setting: SettingTypeString;
    onClick?: () => void;
    selected?: boolean;
}> = ({ path, setting, selected, onClick }) => {
    const [settingValue, setSettingValue] = useSetting<string>(path[0], setting.key, setting.defaultValue);
    const [value, setValue] = React.useState<string>(settingValue);

    React.useEffect(() => {
        setValue(settingValue);
    }, [settingValue]);

    return (
        <SettingInputControl
            path={path}
            setting={setting}
            value={value}
            setValue={(value?: any) => setValue(value ?? "")}
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
                            {setting.maxLength && `${value.length} / ${setting.maxLength}`}
                        </div>
                    </Tooltip>
                );
            }}
        >
            <BaseTextField
                id={[...path, setting.key].join("-")}
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