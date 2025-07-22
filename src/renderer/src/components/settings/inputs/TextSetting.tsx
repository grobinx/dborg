import { SettingTypeText } from "../SettingsTypes";
import SettingInputControl, { calculateWidth } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import { validateStringLength, validateTextRows } from "./validations";

export const TextSetting: React.FC<{
    path: string[];
    setting: SettingTypeText;
    onChange: (value: string, valid?: boolean) => void;
    onClick?: () => void;
    values: Record<string, any>;
    selected?: boolean;
}> = ({ path, setting, onChange, values, selected, onClick }) => {

    return (
        <SettingInputControl
            path={path}
            setting={setting}
            values={values}
            onChange={onChange}
            selected={selected}
            onClick={onClick}
            validate={(value: string) =>
                validateTextRows(
                    value, setting.minRows, setting.maxRows,
                    () => validateStringLength(value, setting.minLength, setting.maxLength))
            }
        >
            <BaseTextField
                multiline
                rows={setting.rows || 4}
                sx={{
                    width: calculateWidth(setting)
                }}
            />
        </SettingInputControl>
    );
};