import { SettingTypeText } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, InputControlContext } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { validateStringLength, validateTextRows } from "./validations";
import React from "react";

export const TextSetting: React.FC<{
    path: string[];
    setting: SettingTypeText;
    onChange: (value: string, valid?: boolean) => void;
    onClick?: () => void;
    values: Record<string, any>;
    selected?: boolean;
}> = ({ path, setting, onChange, values, selected, onClick }) => {
    const contextRef = React.useRef<InputControlContext>(null);

    return (
        <SettingInputControl
            contextRef={contextRef}
            path={path}
            setting={setting}
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
                    setting.maxLength ? <div className="block">{`${contextRef.current?.value.length} / ${setting.maxLength}`}</div> : undefined,
                    setting.maxRows ? <div className="block">{`${(contextRef.current?.value.length ? contextRef.current?.value.split('\n').length : 0)} / ${setting.maxRows}`}</div> : undefined,
                ];
                return policy.filter(Boolean);
            }}
        >
            <BaseTextField
                multiline
                rows={setting.rows || 4}
                sx={{
                    width: calculateWidth(setting)
                }}
            />
        </SettingInputControl>
    );
};