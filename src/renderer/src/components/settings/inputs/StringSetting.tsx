import { SettingTypeString } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";

export const StringSetting: React.FC<{
    path: string[];
    setting: SettingTypeString;
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
        >
            <BaseTextField
                sx={{
                    width: calculateWidth(setting)
                }}
                slotProps={{
                    htmlInput: {
                        maxLength: setting.maxLength,
                        minLength: setting.minLength,
                    }
                }}
            />
        </SettingInputControl>
    );
};