import { SettingTypeRange, SettingTypeString } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import React from "react";
import BaseSlider from "../base/BaseSlider";
import { Tooltip } from "@mui/material";

export const RangeSetting: React.FC<{
    path: string[];
    setting: SettingTypeRange;
    onChange?: (value: [number, number], valid?: boolean) => void;
    onClick?: () => void;
    values: Record<string, any>;
    selected?: boolean;
}> = ({ path, setting, onChange, values, selected, onClick }) => {
    const [value, setValue] = React.useState<[number, number]>(
        values[setting.key] ?? setting.defaultValue ?? [setting.min, setting.max]
    );

    const handleChange = (_e, newValue: number[], activeThumb: number) => {
        if (newValue) {
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
            path={path}
            setting={setting}
            value={value}
            setValue={(value?: any) => setValue(value)}
            values={values}
            onStore={onChange}
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
                disabled={disabledControl(setting, values)}
                onClick={onClick}
            />
        </SettingInputControl>
    );
};