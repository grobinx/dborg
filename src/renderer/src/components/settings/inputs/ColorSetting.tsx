import { SettingTypeColor } from "../SettingsTypes";
import SettingInputControl, { calculateWidth } from "../SettingInputControl";
import React from "react";
import { useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getSettingDefault, useSetting } from "@renderer/contexts/SettingsContext";
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