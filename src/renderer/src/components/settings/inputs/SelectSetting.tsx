import { SettingTypeSelect } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import React from "react";
import { Box, ClickAwayListener, Divider, MenuItem, MenuList, Paper, Popper, Select, SelectChangeEvent, Typography } from "@mui/material";
import { getSettingDefault, useSetting } from "@renderer/contexts/SettingsContext";

export const SelectSetting: React.FC<{
    setting: SettingTypeSelect;
    onClick?: () => void;
    selected?: boolean;
}> = ({ setting, selected, onClick }) => {
    const [settingValue, setSettingValue] = useSetting<string | number | undefined>(setting.storageGroup, setting.key, setting.defaultValue);
    const [value, setValue] = React.useState<string | number | undefined>(settingValue);
    const [open, setOpen] = React.useState(false);
    const anchorRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        setValue(settingValue ?? getSettingDefault(setting.storageGroup, setting.key, setting.defaultValue));
    }, [settingValue]);

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event: Event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
            return;
        }
        setOpen(false);
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
            <Box>
                <Select
                    ref={anchorRef}
                    id={`SettingEditor-${setting.storageGroup}-${setting.key}`}
                    sx={{
                        width: calculateWidth(setting)
                    }}
                    value={value ?? ""}
                    onChange={(e: SelectChangeEvent<string | number>) => {
                        setValue(e.target.value);
                    }}
                    displayEmpty
                    open={false}
                    disabled={disabledControl(setting)}
                    onClick={() => {
                        onClick?.();
                        handleToggle();
                    }}
                    renderValue={(selected) => (selected ? selected : "Select an option")}
                />
                <Popper
                    open={open}
                    anchorEl={anchorRef.current}
                    placement="bottom-start"
                    style={{ 
                        zIndex: 1300,
                        width: anchorRef.current ? `${anchorRef.current.offsetWidth}px` : "auto",
                    }}
                >
                    <Paper>
                        <ClickAwayListener onClickAway={handleClose}>
                            <Box>
                                <MenuList
                                    sx={{
                                        maxHeight: 200,
                                        overflow: "auto",
                                    }}
                                >
                                    <MenuItem value="option1" onClick={() => setValue("option1")}>
                                        Opcja 1
                                    </MenuItem>
                                    <MenuItem value="option2" onClick={() => setValue("option2")}>
                                        Opcja 2
                                    </MenuItem>
                                    <MenuItem value="option3" onClick={() => setValue("option3")}>
                                        Opcja 3
                                    </MenuItem>
                                    <MenuItem value="option4" onClick={() => setValue("option4")}>
                                        Opcja 4
                                    </MenuItem>
                                    <MenuItem value="option5" onClick={() => setValue("option5")}>
                                        Opcja 5
                                    </MenuItem>
                                    <MenuItem value="option6" onClick={() => setValue("option6")}>
                                        Opcja 6
                                    </MenuItem>
                                    <MenuItem value="option7" onClick={() => setValue("option7")}>
                                        Opcja 7
                                    </MenuItem>
                                </MenuList>
                                <Divider />
                                <Box
                                    sx={{
                                        padding: 2,
                                    }}
                                >
                                    <Typography variant="subtitle2" color="textSecondary">
                                        Stały element
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Opis pozycji lub dodatkowe informacje.
                                    </Typography>
                                </Box>
                            </Box>
                        </ClickAwayListener>
                    </Paper>
                </Popper>
            </Box>
        </SettingInputControl>
    );
};