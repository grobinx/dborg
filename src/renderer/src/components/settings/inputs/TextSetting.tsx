import { SettingTypeText } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { validateStringLength, validateTextRows } from "./validations";
import React from "react";

export const TextSetting: React.FC<{
    path: string[];
    setting: SettingTypeText;
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
            values={values}
            onChange={onChange}
            selected={selected}
            onClick={onClick}
            validate={(value: string) =>
                validateTextRows(
                    value, setting.minRows, setting.maxRows,
                    () => validateStringLength(value, setting.minLength, setting.maxLength))
            }
            policy={() => {
                const policy = [
                    setting.maxLength ? <div key="max-length" className="block">{`${value.length} / ${setting.maxLength}`}</div> : undefined,
                    setting.maxRows ? <div key="max-rows" className="block">{`${(value.length ? value.split('\n').length : 0)} / ${setting.maxRows}`}</div> : undefined,
                ];
                return policy.filter(Boolean);
            }}
        >
            <BaseTextField
                id={[...path, setting.key].join("-")}
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setValue(e.target.value);
                }}
                disabled={disabledControl(setting, values)}
                onClick={onClick}
                multiline
                rows={setting.rows || 4}
                sx={{
                    width: calculateWidth(setting)
                }}
            />
        </SettingInputControl>
    );
};