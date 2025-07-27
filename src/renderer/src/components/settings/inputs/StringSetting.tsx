import { SettingTypeString } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { validateStringLength } from "./validations";
import React from "react";
import { Tooltip } from "@mui/material";

export const StringSetting: React.FC<{
    path: string[];
    setting: SettingTypeString;
    onChange?: (value: string, valid?: boolean) => void;
    onClick?: () => void;
    values: Record<string, any>;
    selected?: boolean;
}> = ({ path, setting, onChange, values, selected, onClick }) => {
    const [value, setValue] = React.useState<string>(values[setting.key] ?? setting.defaultValue ?? "");

    return (
        <SettingInputControl
            path={path}
            setting={setting}
            value={value}
            setValue={(value?: any) => setValue(value ?? "")}
            onChange={onChange}
            values={values}
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
                disabled={disabledControl(setting, values)}
                onClick={onClick}
            />
        </SettingInputControl>
    );
};