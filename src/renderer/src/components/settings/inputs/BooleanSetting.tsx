import { SettingTypeBoolean } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl, SettingInputControlDescription } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { validateStringLength } from "./validations";
import React, { useRef } from "react";
import { Tooltip } from "@mui/material";
import { getSettingDefault, useSetting } from "@renderer/contexts/SettingsContext";
import BaseCheckbox from "../base/BaseCheckbox";

export const BooleanSetting: React.FC<{
    setting: SettingTypeBoolean;
    onClick?: () => void;
    selected?: boolean;
}> = ({ setting, selected, onClick }) => {
    const [settingValue, setSettingValue] = useSetting<boolean | undefined>(setting.storageGroup, setting.key, setting.defaultValue);
    const [value, setValue] = React.useState<boolean | undefined>(settingValue);
    const checkboxRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setValue(settingValue ?? getSettingDefault(setting.storageGroup, setting.key, setting.defaultValue));
    }, [settingValue]);

    const handleDescriptionClick = () => {
        if (checkboxRef.current) {
            checkboxRef.current.click();
        }
        onClick?.();
    };

    return (
        <SettingInputControl
            setting={setting}
            value={value}
            setValue={(value?: any) => setValue(value)}
            onStore={(value: boolean) => setSettingValue(value)}
            selected={selected}
            onClick={onClick}
            description={false}
        >
            <SettingInputControlDescription
                description={setting.description}
                onClick={handleDescriptionClick} // Obsługa kliknięcia na opis
            >
                <BaseCheckbox
                    id={`SettingEditor-${setting.storageGroup}-${setting.key}`}
                    value={value ?? false}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setValue(e.target.checked);
                    }}
                    disabled={disabledControl(setting)}
                    slotProps={{
                        input: {
                            ref: checkboxRef, 
                        }
                    }}
                    onClick={onClick}
                />
            </SettingInputControlDescription>
        </SettingInputControl>
    );
};