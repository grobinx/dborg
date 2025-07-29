import { SettingTypeNumber, SettingTypeString } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { validateNumberRange, validateStringLength } from "./validations";
import React from "react";
import { Tooltip } from "@mui/material";
import { getSettingDefault, useSetting } from "@renderer/contexts/SettingsContext";

export const NumberSetting: React.FC<{
    setting: SettingTypeNumber;
    onClick?: () => void;
    selected?: boolean;
}> = ({ setting, selected, onClick }) => {
    const [settingValue, setSettingValue] = useSetting<number>(setting.storageGroup, setting.key, setting.defaultValue);
    const [value, setValue] = React.useState<number | undefined>(settingValue);

    React.useEffect(() => {
        setValue(settingValue ?? getSettingDefault(setting.storageGroup, setting.key, setting.defaultValue));
    }, [settingValue]);

    return (
        <SettingInputControl
            setting={setting}
            value={value}
            setValue={(value?: any) => setValue(value)}
            onStore={(value: number) => setSettingValue(value)}
            selected={selected}
            onClick={onClick}
            validate={(value: number) => validateNumberRange(value, setting.min, setting.max)}
            policy={() => {
                if (setting.min === undefined && setting.max === undefined) {
                    return null;
                }
                return (
                    <Tooltip
                        title={'Min ≥ Step ≤ Max'}
                    >
                        <div className="block">
                            {setting.min !== undefined && `${setting.min} ≥ `}
                            {(setting.step !== undefined && setting.step > 1) && setting.step}
                            {setting.max !== undefined && ` ≤ ${setting.max}`}
                        </div>
                    </Tooltip>
                );
            }}
        >
            <BaseTextField
                id={`SettingEditor-${setting.storageGroup}-${setting.key}`}
                type="number"
                sx={{
                    width: calculateWidth(setting)
                }}
                slotProps={{
                    htmlInput: {
                        min: setting.min,
                        max: setting.max,
                        step: setting.step || 1,
                    }
                }}
                value={String(value) ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setValue(!!e.target.value ? Number(e.target.value) : undefined);
                }}
                disabled={disabledControl(setting)}
                onClick={onClick}
            />
        </SettingInputControl>
    );
};