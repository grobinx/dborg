import { SettingTypeColor } from "../SettingsTypes";
import SettingInputControl, { calculateWidth } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import React from "react";
import { Autocomplete, InputAdornment, useTheme } from "@mui/material";
import ToolButton from "@renderer/components/ToolButton";
import ColorPicker from "@renderer/components/useful/ColorPicker";
import { useTranslation } from "react-i18next";
import Tooltip from "@renderer/components/Tooltip";
import { htmlColors } from "@renderer/utils/colors";
import { getSettingDefault, useSetting } from "@renderer/contexts/SettingsContext";

export const ColorSetting: React.FC<{
    setting: SettingTypeColor;
    onClick?: () => void;
    selected?: boolean;
}> = ({ setting, selected, onClick }) => {
    const [colorPickerAnchoreEl, setColorPickerAnchoreEl] = React.useState<null | HTMLElement>(null);
    const theme = useTheme();
    const { t } = useTranslation();
    const [open, setOpen] = React.useState(false); // Stan otwierania listy
    const [settingValue, setSettingValue] = useSetting<string | undefined>(setting.storageGroup, setting.key, setting.defaultValue);
    const [value, setValue] = React.useState<string | undefined>(settingValue);

    React.useEffect(() => {
        setValue(settingValue ?? getSettingDefault(setting.storageGroup, setting.key, setting.defaultValue));
    }, [settingValue]);

    const handleColorPickerOpen = (event: React.MouseEvent<HTMLElement>) => {
        setColorPickerAnchoreEl(event.currentTarget);
    };

    const handleColorPickerClose = () => {
        setColorPickerAnchoreEl(null);
    };

    const onChangeColor = (value: string) => {
        setValue(value);
    }

    const handleFocus = () => {
        setOpen(false); // Nie otwieraj listy automatycznie na focus
    };

    const handleBlur = () => {
        setOpen(false); // Zamknij listę po opuszczeniu pola
    };

    return (
        <SettingInputControl
            setting={setting}
            value={value}
            setValue={(value?: any) => setValue(value)}
            onStore={(value: string) => setSettingValue(value)}
            selected={selected}
            onClick={onClick}
        >
            <Autocomplete
                //freeSolo
                open={open} // Kontroluj otwieranie listy
                onOpen={() => setOpen(true)} // Otwórz listę ręcznie
                onClose={() => setOpen(false)} // Zamknij listę ręcznie
                autoHighlight
                options={htmlColors}
                value={value}
                onInputChange={(_e, newValue) => {
                    setValue(newValue);
                }}
                slotProps={{
                    clearIndicator: {
                        style: {
                            borderRadius: '4px',
                        }
                    },
                    popupIndicator: {
                        style: {
                            borderRadius: '4px',
                        }
                    },
                }}
                renderInput={(params) => {
                    const { InputProps, id, ...otherParams } = params;
                    const { endAdornment, ...inputProps } = InputProps;
                    return (
                        <BaseTextField
                            id={`SettingEditor-${setting.storageGroup}-${setting.key}`}
                            {...otherParams}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            sx={{
                                width: calculateWidth(setting)
                            }}
                            slotProps={{
                                input: {
                                    ...inputProps,
                                    endAdornment: (
                                        <>
                                            <InputAdornment
                                                position="end"
                                                style={{ cursor: "pointer" }}
                                            >
                                                <Tooltip title={t("pick-a-color", "Pick a color")}>
                                                    <ToolButton onClick={handleColorPickerOpen}>
                                                        <div
                                                            style={{
                                                                width: '18px',
                                                                height: '18px',
                                                                backgroundColor: value || '#000000',
                                                                border: `1px solid ${theme.palette.primary.main}`,
                                                                borderRadius: '4px',
                                                            }}
                                                        />
                                                    </ToolButton>
                                                </Tooltip>
                                                <ColorPicker
                                                    value={value || "#000000"}
                                                    onChange={onChangeColor}
                                                    anchorEl={colorPickerAnchoreEl}
                                                    onClose={handleColorPickerClose}
                                                    picker={setting.picker}
                                                />
                                            </InputAdornment>
                                            {endAdornment}
                                        </>
                                    ),
                                },
                            }}
                        />
                    );
                }}
            />
        </SettingInputControl>
    );
};