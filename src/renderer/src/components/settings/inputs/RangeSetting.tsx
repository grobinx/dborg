import { SettingTypeRange, SettingTypeString } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import React from "react";
import BaseSlider from "../base/BaseSlider";
import { Tooltip } from "@mui/material";
import { useSetting } from "@renderer/contexts/SettingsContext";

export const RangeSetting: React.FC<{
    setting: SettingTypeRange;
    onClick?: () => void;
    selected?: boolean;
}> = ({ setting, selected, onClick }) => {
    const [settingValue, setSettingValue] = useSetting<[number, number] | undefined>(setting.storageGroup, setting.key, setting.defaultValue);
    const [value, setValue] = React.useState<[number, number] | undefined>(settingValue);

    const handleChange = (_e, newValue: number[], activeThumb: number) => {
        if (newValue && value) {
            if (activeThumb === 0) {
                newValue = [Math.min(newValue[0], value[1] - (setting.minDistance ?? 0)), value[1]];
            } else {
                newValue = [value[0], Math.max(newValue[1], value[0] + (setting.minDistance ?? 0))];
            }
        }
        setValue(newValue as [number, number]);
    };

    return (
        <SettingInputControl
            setting={setting}
            value={value}
            setValue={(value?: any) => setValue(value)}
            onStore={(value: [number, number]) => setSettingValue(value)}
            selected={selected}
            onClick={onClick}
            policy={() => {
                if (setting.minDistance) {
                    return (
                        <Tooltip
                            title={'Min ≥ Step [: Min Distance] ≤ Max'}
                        >
                            <div className="block">
                                {setting.min}
                                {" ≥ "}
                                {setting.step ?? 1}
                                {setting.minDistance && ` : ${setting.minDistance}`}
                                {" ≤ "}
                                {setting.max}
                            </div>
                        </Tooltip>
                    );
                }
                return `${setting.min} ≥ ${setting.minDistance ?? 0} ≤ ${setting.max} :${setting.step}`;
            }}
        >
            <BaseSlider
                width={calculateWidth(setting)}
                onChange={handleChange}
                disableSwap
                min={setting.min}
                max={setting.max}
                step={setting.step}
                value={value ?? [setting.min, setting.max]}
                disabled={disabledControl(setting)}
                onClick={onClick}
            />
        </SettingInputControl>
    );
};