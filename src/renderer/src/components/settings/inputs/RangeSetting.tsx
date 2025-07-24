import { SettingTypeRange, SettingTypeString } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, InputControlContext } from "../SettingInputControl";
import React from "react";
import BaseSlider from "../base/BaseSlider";
import { Tooltip } from "@mui/material";

export const RangeSetting: React.FC<{
    path: string[];
    setting: SettingTypeRange;
    onChange: (value: [number, number], valid?: boolean) => void;
    onClick?: () => void;
    values: Record<string, any>;
    selected?: boolean;
}> = ({ path, setting, onChange, values, selected, onClick }) => {
    const contextRef = React.useRef<InputControlContext>(null);

    const handleChange = (newValue: number[], activeThumb: number) => {
        let value: [number, number] = newValue as [number, number];
        if (contextRef.current) {
            if (activeThumb === 0) {
                value = [Math.min(newValue[0], contextRef.current.value[1] - (setting.minDistance ?? 0)), contextRef.current.value[1]];
            } else {
                value = [contextRef.current.value[0], Math.max(newValue[1], contextRef.current.value[0] + (setting.minDistance ?? 0))];
            }
        }
        contextRef.current?.setValue(value);
    };

    return (
        <SettingInputControl
            path={path}
            setting={setting}
            contextRef={contextRef}
            values={values}
            onChange={onChange}
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
            />
        </SettingInputControl>
    );
};