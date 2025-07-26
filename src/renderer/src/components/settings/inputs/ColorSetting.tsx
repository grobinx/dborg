import { SettingTypeColor } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, InputControlContext } from "../SettingInputControl";
import BaseTextField from "../base/BaseTextField";
import React from "react";
import { Autocomplete, InputAdornment } from "@mui/material";
import ToolButton from "@renderer/components/ToolButton";
import ColorPicker from "@renderer/components/useful/ColorPicker";
import { useTranslation } from "react-i18next";
import Tooltip from "@renderer/components/Tooltip";
import { htmlColors } from "@renderer/utils/colors";

export const ColorSetting: React.FC<{
    path: string[];
    setting: SettingTypeColor;
    onChange: (value: string, valid?: boolean) => void;
    onClick?: () => void;
    values: Record<string, any>;
    selected?: boolean;
}> = ({ path, setting, onChange, values, selected, onClick }) => {
    const contextRef = React.useRef<InputControlContext>(null);
    const [colorPickerAnchoreEl, setColorPickerAnchoreEl] = React.useState<null | HTMLElement>(null);
    const { t } = useTranslation();

    const handleColorPickerOpen = (event: React.MouseEvent<HTMLElement>) => {
        if (event.shiftKey) {
            contextRef.current?.setValue(undefined);
            return;
        }
        setColorPickerAnchoreEl(event.currentTarget);
    };

    const handleColorPickerClose = () => {
        setColorPickerAnchoreEl(null);
    };

    const onChangeColor = (value: string) => {
        contextRef.current?.setValue(value);
    }

    return (
        <SettingInputControl
            path={path}
            setting={setting}
            contextRef={contextRef}
            values={values}
            onChange={onChange}
            selected={selected}
            onClick={onClick}
        >
            <Autocomplete
                freeSolo
                autoHighlight
                options={htmlColors}
                value={contextRef.current?.value}
                onInputChange={(_e, newValue) => {
                    contextRef.current?.setValue(newValue);
                }}
                renderInput={(params) => (
                    <BaseTextField
                        {...params}
                        sx={{
                            width: calculateWidth(setting)
                        }}
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment
                                        position="end"
                                        style={{ cursor: "pointer" }}
                                    >
                                        <Tooltip title={t("pick-a-color-or-clear-shift", "Pick a color or clear with [Shift]")}>
                                            <ToolButton onClick={handleColorPickerOpen}>
                                                <div
                                                    style={{
                                                        width: '18px',
                                                        height: '18px',
                                                        backgroundColor: contextRef.current?.value || '#000000',
                                                        border: '1px solid #ccc',
                                                        borderRadius: '4px',
                                                    }}
                                                />
                                            </ToolButton>
                                        </Tooltip>
                                        <ColorPicker
                                            value={contextRef.current?.value || "#000000"}
                                            onChange={onChangeColor}
                                            anchorEl={colorPickerAnchoreEl}
                                            onClose={handleColorPickerClose}
                                        />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                )}
            />
        </SettingInputControl>
    );
};