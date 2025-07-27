import { SettingTypePassword } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl, InputControlContext } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { validatePassword, validateStringLength, validateTextRows } from "./validations";
import { InputAdornment, Tooltip, useTheme } from "@mui/material";
import ToolButton from "@renderer/components/ToolButton";
import React from "react";
import { useTranslation } from "react-i18next";

export const PasswordSetting: React.FC<{
    path: string[];
    setting: SettingTypePassword;
    onChange: (value: string, valid?: boolean) => void;
    onClick?: () => void;
    values: Record<string, any>;
    selected?: boolean;
}> = ({ path, setting, onChange, values, selected, onClick }) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const theme = useTheme();
    const { t } = useTranslation();
    const [value, setValue] = React.useState<string>(values[setting.key] ?? setting.defaultValue ?? "");

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
            path={path}
            setting={setting}
            values={values}
            value={value}
            setValue={(value?: any) => setValue(value ?? "")}
            onChange={onChange}
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
                return policy.filter(Boolean);
            }}
        >
            <BaseTextField
                id={[...path, setting.key].join("-")}
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
                    let newValue = e.target.value;
                    if (typeof setting.hash === "function") {
                        newValue = setting.hash(newValue);
                    }
                    setValue(newValue);
                }}
                disabled={disabledControl(setting, values)}
                onClick={onClick}
            />
        </SettingInputControl>
    );
};