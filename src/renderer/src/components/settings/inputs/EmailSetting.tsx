import { SettingTypeEmail } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { validateEmail, validateStringLength } from "./validations";
import React from "react";

export const EmailSetting: React.FC<{
    path: string[];
    setting: SettingTypeEmail;
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
            setValue={(value?: any) => setValue(value)}
            values={values}
            onStore={onChange}
            selected={selected}
            onClick={onClick}
            validate={(value: string) => 
                validateEmail(
                    value,
                    () => validateStringLength(value, setting.minLength, setting.maxLength)
                )}
            policy={() => setting.maxLength ? `${value.length} / ${setting.maxLength}` : undefined}
        >
            <BaseTextField
                type="email"
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