import { SettingTypeSelect } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import React from "react";
import { Box, ClickAwayListener, Divider, MenuItem, MenuList, Paper, Popper, Select, SelectChangeEvent, Typography } from "@mui/material";
import { getSettingDefault, useSetting } from "@renderer/contexts/SettingsContext";
import { FormattedContent, FormattedText } from "@renderer/components/useful/FormattedText";
import { SelectField } from "@renderer/components/inputs/SelectField";

export const SelectSetting: React.FC<{
    setting: SettingTypeSelect;
    onClick?: () => void;
    selected?: boolean;
}> = ({ setting, selected, onClick }) => {
    const [settingValue, setSettingValue] = useSetting<string | number | undefined>(setting.storageGroup, setting.key, setting.defaultValue);
    const [value, setValue] = React.useState<string | number | undefined>(settingValue);

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
            <SelectField
                id={`SettingEditor-${setting.storageGroup}-${setting.key}`}
                width={calculateWidth(setting)}
                value={value ?? ""}
                onChange={value => {
                    setValue(value);
                }}
                disabled={disabledControl(setting)}
                onClick={onClick}
                options={setting.options}
            />
        </SettingInputControl>
    );
};