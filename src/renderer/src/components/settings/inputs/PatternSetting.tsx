import React from "react";
import { SettingTypePattern } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, InputControlContext } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";

export const PatternSetting: React.FC<{
    path: string[];
    setting: SettingTypePattern;
    onChange: (value: string, valid?: boolean) => void;
    onClick?: () => void;
    values: Record<string, any>;
    selected?: boolean;
}> = ({ path, setting, onChange, values, selected, onClick }) => {
    const contextRef = React.useRef<InputControlContext>(null);
    const [inputValue, setInputValue] = React.useState("");

    const handleInputChange = (value: string) => {
        const maskedValue = applyMask(value, setting.mask, setting.replacement);
        setInputValue(maskedValue); // Aktualizuj wartość pola tekstowego
        contextRef.current?.setValue(maskedValue);
    };

    const applyMask = (value: string, mask: string, replacement: Record<string, RegExp>): string => {
        let maskedValue = "";
        let valueIndex = 0;

        for (let i = 0; i < mask.length; i++) {
            const maskChar = mask[i];
            const replacementPattern = replacement[maskChar];

            if (replacementPattern) {
                if (value[valueIndex] && replacementPattern.test(value[valueIndex])) {
                    maskedValue += value[valueIndex];
                    valueIndex++;
                } else {
                    break;
                }
            } else {
                maskedValue += maskChar;
                if (value[valueIndex] === maskChar) {
                    valueIndex++;
                }
            }
        }

        return maskedValue;
    };

    const validatePattern = (value: string, mask: string, replacement: Record<string, RegExp>): boolean => {
        if (value.length !== mask.length) return false;

        for (let i = 0; i < mask.length; i++) {
            const maskChar = mask[i];
            const replacementPattern = replacement[maskChar];

            if (replacementPattern && !replacementPattern.test(value[i])) {
                return false;
            }

            if (!replacementPattern && value[i] !== maskChar) {
                return false;
            }
        }

        return true;
    };

    return (
        <SettingInputControl
            contextRef={contextRef}
            path={path}
            setting={setting}
            values={values}
            onChange={onChange}
            selected={selected}
            onClick={onClick}
            validate={(value: string) => validatePattern(value, setting.mask, setting.replacement)}
        >
            <BaseTextField
                onChange={handleInputChange} // Obsługa zmiany wartości
                sx={{
                    width: calculateWidth(setting),
                }}
            />
        </SettingInputControl>
    );
};