import { SettingTypeText } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { validateStringLength, validateTextRows } from "./validations";
import React from "react";
import { getSettingDefault, useSetting } from "@renderer/contexts/SettingsContext";
import { Stack } from "@mui/material";
import { TextareaField } from "@renderer/components/inputs/TextareaField";

export const TextSetting: React.FC<{
    setting: SettingTypeText;
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
                validateTextRows(
                    value, setting.minRows, setting.maxRows,
                    () => validateStringLength(value, setting.minLength, setting.maxLength))
            }
            policy={() => {
                const policy = [
                    setting.maxLength ? <div key="max-length" className="block">{`${(value ?? "").length} / ${setting.maxLength}`}</div> : undefined,
                    setting.maxRows ? <div key="max-rows" className="block">{`${(value ?? "").length ? (value ?? "").split('\n').length : 0} / ${setting.maxRows}`}</div> : undefined,
                ];
                return <Stack direction="row">{policy.filter(Boolean)}</Stack>;
            }}
        >
            <TextareaField
                id={`SettingEditor-${setting.storageGroup}-${setting.key}`}
                value={value}
                onChange={(value) => {
                    setValue(value);
                }}
                disabled={disabledControl(setting)}
                onClick={onClick}
                rows={setting.rows || 4}
                width={calculateWidth(setting)}
            />
        </SettingInputControl>
    );
};