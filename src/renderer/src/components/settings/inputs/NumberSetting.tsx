import { SettingTypeNumber, SettingTypeString } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, InputControlContext } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { validateStringLength } from "./validations";
import React from "react";
import { Tooltip } from "@mui/material";

export const NumberSetting: React.FC<{
    path: string[];
    setting: SettingTypeNumber;
    onChange: (value: string, valid?: boolean) => void;
    onClick?: () => void;
    values: Record<string, any>;
    selected?: boolean;
}> = ({ path, setting, onChange, values, selected, onClick }) => {
    const contextRef = React.useRef<InputControlContext>(null);

    const handleChange = (value: string) => {
        contextRef.current?.setValue(!!value ? Number(value) : undefined);
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
                onChange={(_e, value) => handleChange(value)}
            />
        </SettingInputControl>
    );
};