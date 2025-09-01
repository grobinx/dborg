import { SettingTypePassword } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { validatePassword, validateStringLength, validateTextRows } from "./validations";
import { InputAdornment, Stack, Tooltip, useTheme } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { getSettingDefault, useSetting } from "@renderer/contexts/SettingsContext";
import { ToolButton } from "@renderer/components/buttons/ToolButton";

export const PasswordSetting: React.FC<{
    setting: SettingTypePassword;
    onClick?: () => void;
    selected?: boolean;
}> = ({ setting, selected, onClick }) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const theme = useTheme();
    const { t } = useTranslation();
    const [settingValue, setSettingValue] = useSetting<string | undefined>(setting.storageGroup, setting.key, setting.defaultValue);
    const [value, setValue] = React.useState<string | undefined>(settingValue);

    React.useEffect(() => {
        setValue(settingValue ?? getSettingDefault(setting.storageGroup, setting.key, setting.defaultValue));
    }, [settingValue]);

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const validate = (value: string) => {
        return validatePassword(
            value,
            setting.atLeastOneLowercase, setting.atLeastOneUppercase,
            setting.atLeastOneDigit, setting.atLeastOneSpecialChar,
            setting.specialChars, setting.noSpaces,
            () => validateStringLength(value, setting.minLength, setting.maxLength)
        );
    };
    const generatePassword = () => {
        const length = (setting.maxLength ?? 64) - (setting.minLength ?? 12);
        const chars = [
            ...((setting.atLeastOneLowercase ?? true) ? "abcdefghijklmnopqrstuvwxyz" : ""),
            ...((setting.atLeastOneUppercase ?? true) ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ" : ""),
            ...((setting.atLeastOneDigit ?? true) ? "0123456789" : ""),
            ...((setting.atLeastOneSpecialChar ?? true) ? (setting.specialChars || "!@#$%^&*()_+-=[]{}|;:,.<>?") : "")
        ].join("");

        let password = "";
        let guard = 0;
        do {
            password = "";
            for (let i = 0; i < (setting.minLength ?? 12) + Math.random() * length; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            // It shouldn't happen, but the probability is still there.
            if (++guard > 100) {
                console.warn("Password generation guard triggered. Too many attempts to generate a valid password.");
                break;
            }
        } while (validate(password) !== true);

        setValue(password);
    }

    return (
        <SettingInputControl
            setting={setting}
            value={value}
            setValue={(value?: any) => setValue(value)}
            onStore={(value: string) => setSettingValue(typeof setting.hash === "function" ? setting.hash(value) : value)}
            selected={selected}
            onClick={onClick}
            validate={(value: string) => validate(value)}
            policy={() => {
                const policy = [
                    setting.atLeastOneUppercase && (
                        <Tooltip title={t("policy-uppercase", "At least one uppercase letter")} key="uppercase">
                            <div key="uppercase-icon" className="block"><theme.icons.UpperLetter /></div>
                        </Tooltip>
                    ),
                    setting.atLeastOneLowercase && (
                        <Tooltip title={t("policy-lowercase", "At least one lowercase letter")} key="lowercase">
                            <div key="lowercase-icon" className="block"><theme.icons.LowerLetter /></div>
                        </Tooltip>
                    ),
                    setting.atLeastOneDigit && (
                        <Tooltip title={t("policy-digit", "At least one digit")} key="digit">
                            <div key="digit-icon" className="block"><theme.icons.Digit /></div>
                        </Tooltip>
                    ),
                    setting.atLeastOneSpecialChar && (
                        <Tooltip
                            title={t(
                                "policy-special-char",
                                'At least one special character ({{specialChars}})',
                                {
                                    specialChars: setting.specialChars || "!@#$%^&*()_+-=[]{}|;':\",.<>?/"
                                }
                            )}
                            key="special-char"
                        >
                            <div key="special-char-icon" className="block"><theme.icons.SpecialChar /></div>
                        </Tooltip>
                    ),
                    setting.noSpaces && (
                        <Tooltip title={t("policy-no-spaces", "No spaces allowed")} key="no-spaces">
                            <div key="no-spaces-icon" className="block"><theme.icons.NoSpaces /></div>
                        </Tooltip>
                    ),
                ];
                return <Stack direction="row">{policy.filter(Boolean)}</Stack>;
            }}
        >
            <BaseTextField
                id={`SettingEditor-${setting.storageGroup}-${setting.key}`}
                type={showPassword ? "text" : "password"}
                sx={{
                    width: calculateWidth(setting)
                }}
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment
                                position="end"
                            >
                                <Tooltip title={showPassword ? t("hide-password", "Hide password") : t("show-password", "Show password")}>
                                    <span>
                                        <ToolButton
                                            onClick={handleClickShowPassword}
                                            selected={showPassword}
                                        >
                                            {showPassword ? <theme.icons.VisibilityOff /> : <theme.icons.Visibility />}
                                        </ToolButton>
                                    </span>
                                </Tooltip>
                                {setting.canGenerate && (
                                    <Tooltip title={t("generate-password", "Generate password")}>
                                        <span>
                                            <ToolButton
                                                onClick={generatePassword}
                                            >
                                                <theme.icons.GeneratePassword />
                                            </ToolButton>
                                        </span>
                                    </Tooltip>
                                )}
                            </InputAdornment>
                        ),
                    },
                }}
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