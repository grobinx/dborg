import React from "react";
import { SettingTypePattern } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { useMask } from "@react-input/mask";

export const PatternSetting: React.FC<{
    path: string[];
    setting: SettingTypePattern;
    onChange?: (value: string, valid?: boolean) => void;
    onClick?: () => void;
    values: Record<string, any>;
    selected?: boolean;
}> = ({ path, setting, onChange, values, selected, onClick }) => {
    const inputRef = useMask({ mask: setting.mask, replacement: setting.replacement, showMask: true });
    const [value, setValue] = React.useState<string>(values[setting.key] ?? setting.defaultValue ?? "");

    return (
        <SettingInputControl
            path={path}
            setting={setting}
            value={value}
            setValue={(value?: any) => setValue(value ?? "")}
            onStore={onChange}
            selected={selected}
            onClick={onClick}
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
                value={value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setValue(e.target.value);
                }}
                disabled={disabledControl(setting)}
                onClick={onClick}
            />
        </SettingInputControl>
    );
};