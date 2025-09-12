import { SettingTypeColor } from "../SettingsTypes";
import SettingInputControl, { calculateWidth } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import React from "react";
import { Autocomplete, InputAdornment, useTheme } from "@mui/material";
import ColorPicker from "@renderer/components/useful/ColorPicker";
import { useTranslation } from "react-i18next";
import Tooltip from "@renderer/components/Tooltip";
import { getSettingDefault, useSetting } from "@renderer/contexts/SettingsContext";
import { htmlColors } from "@renderer/types/colors";
import { ToolButton } from "@renderer/components/buttons/ToolButton";
import { TextField } from "@renderer/components/inputs/TextField";
import { Adornment } from "@renderer/components/inputs/base/BaseInputField";
import { ColorField } from "@renderer/components/inputs/ColorField";

export const ColorSetting: React.FC<{
    setting: SettingTypeColor;
    onClick?: () => void;
    selected?: boolean;
}> = ({ setting, selected, onClick }) => {
    const theme = useTheme();
    const { t } = useTranslation();
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
        >
            <ColorField
                value={value}
                onChange={value => {
                    setValue(value);
                }}
                width={calculateWidth(setting)}
                onClick={onClick}
            />
        </SettingInputControl>
    );
};