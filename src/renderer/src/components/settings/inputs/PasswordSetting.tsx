import { SettingTypePassword } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, InputControlContext } from "../SettingInputControl";
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
    const contextRef = React.useRef<InputControlContext>(null);

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const validate = (value: string) => {
        return validatePassword(
            value, setting.minLength, setting.maxLength,
            setting.atLeastOneLowercase, setting.atLeastOneUppercase,
            setting.atLeastOneDigit, setting.atLeastOneSpecialChar,
            setting.specialChars, setting.noSpaces
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

        if (contextRef.current) {
            contextRef.current.setValue(password);
        }
    }

    return (
        <SettingInputControl
            contextRef={contextRef}
            path={path}
            setting={setting}
            values={values}
            onChange={(value: string) => {
                if (typeof setting.hash === "function") {
                    value = setting.hash(value);
                }
                onChange(value);
            }}
            selected={selected}
            onClick={onClick}
            validate={(value: string) => validate(value)}
        >
            <BaseTextField
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
            />
        </SettingInputControl>
    );
};