import { SettingTypeEmail } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, InputControlContext } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { validateEmail, validateStringLength } from "./validations";
import React from "react";

export const EmailSetting: React.FC<{
    path: string[];
    setting: SettingTypeEmail;
    onChange: (value: string, valid?: boolean) => void;
    onClick?: () => void;
    values: Record<string, any>;
    selected?: boolean;
}> = ({ path, setting, onChange, values, selected, onClick }) => {
    const contextRef = React.useRef<InputControlContext>(null);

    return (
        <SettingInputControl
            path={path}
            setting={setting}
            contextRef={contextRef}
            values={values}
            onChange={onChange}
            selected={selected}
            onClick={onClick}
            validate={(value: string) => 
                validateEmail(
                    value,
                    () => validateStringLength(value, setting.minLength, setting.maxLength)
                )}
            policy={() => setting.maxLength ? `${contextRef.current?.value.length} / ${setting.maxLength}` : undefined}
        >
            <BaseTextField
                type="email"
                sx={{
                    width: calculateWidth(setting)
                }}
            />
        </SettingInputControl>
    );
};