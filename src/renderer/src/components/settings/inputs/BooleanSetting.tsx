import { SettingTypeBoolean } from "../SettingsTypes";
import SettingInputControl, { disabledControl, SettingInputControlDescription } from "../SettingInputControl";
import React, { useRef } from "react";
import BaseCheckbox from "../base/BaseCheckbox";
import { useSetting } from "@renderer/contexts/SettingsContext";

export const BooleanSetting: React.FC<{
    setting: SettingTypeBoolean;
    onClick?: () => void;
    selected?: boolean;
}> = ({ setting, selected, onClick }) => {
    const [settingValue, setSettingValue] = useSetting<boolean | string | number | null | undefined>(setting.storageGroup, setting.storageKey, setting.defaultValue);
    const [value, setValue] = React.useState<boolean | undefined>(() => {
        if (typeof settingValue === "boolean") return settingValue;
        if (setting.values) {
            return settingValue === setting.values.true ? true : settingValue === setting.values.false ? false : undefined;
        }
        console.error(`BooleanSetting: Invalid value for setting ${setting.storageGroup}.${setting.storageKey}: ${settingValue}. Expected boolean or string matching true/false values.`);
        return undefined;
    });
    const checkboxRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        setValue(() => {
            let result: boolean | undefined;
            const value = settingValue ?? setting.defaultValue;
            if (typeof value === "boolean") {
                result = value;
            }
            else if (setting.values) {
                result = value === setting.values.true ? true : (value === setting.values.false ? false : undefined);
            }
            else {
                console.error(`BooleanSetting: Invalid value for setting ${setting.storageGroup}.${setting.storageKey}: ${settingValue}. Expected boolean or string matching true/false values.`);
            }
            return result;
        });
    }, [setting, settingValue]);

    const handleDescriptionClick = () => {
        if (checkboxRef.current) {
            checkboxRef.current.click();
        }
        onClick?.();
    };

    return (
        <SettingInputControl
            setting={setting}
            value={setting.values ? setting.values[value ? "true" : "false"] : value}
            setValue={(value?: any) => {
                if (typeof value === "boolean") {
                    setValue(value);
                } else if (typeof value === "string" || typeof value === "number") {
                    setValue(value === setting.values?.true);
                } else {
                    console.error(`BooleanSetting: Invalid value type for setting ${setting.storageGroup}.${setting.storageKey}: ${value}. Expected boolean, string, or number.`);
                }
            }}
            onStore={(value: boolean | string | number | null | undefined) => {
                let storeValue: boolean | string | number | null | undefined = value;
                // if (setting.values) {
                //     storeValue = value ? setting.values.true : setting.values.false;
                // }
                setSettingValue(storeValue);
            }}
            selected={selected}
            onClick={onClick}
            description={false}
        >
            <SettingInputControlDescription
                description={setting.description}
                onClick={handleDescriptionClick} // Obsługa kliknięcia na opis
            >
                <BaseCheckbox
                    id={`SettingEditor-${setting.storageGroup}-${setting.storageKey}`}
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