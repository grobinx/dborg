import { FormControl, FormHelperText, InputLabel, TextField, Typography } from "@mui/material";
import { SettingTypeString } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "./SettingInputControl";
import { markdown } from "@renderer/components/useful/MarkdownTransform";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

export const StringSetting: React.FC<{
    path: string[];
    setting: SettingTypeString;
    onChange: (value: string) => void;
    values: Record<string, any>;
}> = ({ path, setting, onChange, values }) => {
    const { t } = useTranslation();
    const fullPath = [...path, setting.key].join('-');
    const [previousValue, setPreviousValue] = useState<string | undefined>(values[setting.key]);
    const [value, setValue] = useState<string>(values[setting.key] ?? setting.defaultValue);
    const [validity, setValidity] = useState<string | undefined>(undefined);
    const [valuesCache, setValuesCache] = useState<Record<string, any>>(values);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (typeof setting.validate === "function") {
                const result = setting.validate(value, valuesCache);
                if (result === false) {
                    setValidity(t("invalid-value", "Invalid value"));
                } else if (typeof result === "string") {
                    setValidity(result);
                } else {
                    setValidity(undefined);
                }
            } else {
                setValidity(undefined);
            }
            setValuesCache((prev) => ({ ...prev, [setting.key]: value }));
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [value, setting]);

    return (
        <SettingInputControl
            path={path}
            setting={setting}
            values={valuesCache}
            validity={validity}
        >
            <TextField
                id={fullPath}
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                    //values[setting.key] = e.target.value;
                }}
                sx={{
                    width: calculateWidth(setting)
                }}
                slotProps={{
                    htmlInput: {
                        maxLength: setting.maxLength,
                        minLength: setting.minLength,
                    }
                }}
                disabled={disabledControl(setting, valuesCache)}
            />
        </SettingInputControl>
    );
};