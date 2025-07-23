import React from "react";
import { SettingTypePattern } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, InputControlContext } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { useMask } from "@react-input/mask";

export const PatternSetting: React.FC<{
    path: string[];
    setting: SettingTypePattern;
    onChange: (value: string, valid?: boolean) => void;
    onClick?: () => void;
    values: Record<string, any>;
    selected?: boolean;
}> = ({ path, setting, onChange, values, selected, onClick }) => {
    const inputRef = useMask({ mask: setting.mask, replacement: setting.replacement, showMask: true });

    return (
        <SettingInputControl
            path={path}
            setting={setting}
            values={values}
            onChange={onChange}
            selected={selected}
            onClick={onClick}
            //validate={(value: string) => validatePattern(value, setting.mask, setting.replacement)}
        >
            <BaseTextField
                sx={{
                    width: calculateWidth(setting),
                    fontFamily: "monospace",
                }}
                slotProps={{
                    input: {
                        style: { fontFamily: "monospace", fontSize: "0.9em" },
                    },
                }}
                inputRef={inputRef}
            />
        </SettingInputControl>
    );
};