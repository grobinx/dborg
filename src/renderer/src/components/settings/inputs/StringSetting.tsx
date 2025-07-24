import { SettingTypeString } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, InputControlContext } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { validateStringLength } from "./validations";
import React from "react";
import { Tooltip } from "@mui/material";

export const StringSetting: React.FC<{
    path: string[];
    setting: SettingTypeString;
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
            validate={(value: string) => validateStringLength(value, setting.minLength, setting.maxLength)}
            policy={() => {
                return (
                    <Tooltip
                        title={'Min ≥ Current / Max'}
                    >
                        <div className="block">
                            {setting.minLength && `${setting.minLength} ≥ `}
                            {setting.maxLength && `${contextRef.current?.value.length} / ${setting.maxLength}`}
                        </div>
                    </Tooltip>
                );
            }}
        >
            <BaseTextField
                sx={{
                    width: calculateWidth(setting)
                }}
            />
        </SettingInputControl>
    );
};