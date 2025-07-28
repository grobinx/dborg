import { SettingTypeNumber, SettingTypeString } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { validateStringLength } from "./validations";
import React from "react";
import { Tooltip } from "@mui/material";

export const NumberSetting: React.FC<{
    path: string[];
    setting: SettingTypeNumber;
    onChange?: (value: number | undefined, valid?: boolean) => void;
    onClick?: () => void;
    values: Record<string, any>;
    selected?: boolean;
}> = ({ path, setting, onChange, values, selected, onClick }) => {
    const [value, setValue] = React.useState<number | undefined>(Number(values[setting.key]) ?? setting.defaultValue);

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
                id={[...path, setting.key].join("-")}
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
                value={value ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setValue(!!e.target.value ? Number(e.target.value) : undefined);
                }}
                disabled={disabledControl(setting, values)}
                onClick={onClick}
            />
        </SettingInputControl>
    );
};