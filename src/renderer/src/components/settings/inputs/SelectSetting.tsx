import { SettingTypeSelect } from "../SettingsTypes";
import SettingInputControl, { calculateWidth, disabledControl } from "../SettingInputControl";
import React from "react";
import { Box, ClickAwayListener, Divider, MenuItem, MenuList, Paper, Popper, Select, SelectChangeEvent, Typography } from "@mui/material";
import { getSettingDefault, useSetting } from "@renderer/contexts/SettingsContext";
import { FormattedContent, FormattedText } from "@renderer/components/useful/FormattedText";

export const SelectSetting: React.FC<{
    setting: SettingTypeSelect;
    onClick?: () => void;
    selected?: boolean;
}> = ({ setting, selected, onClick }) => {
    const [settingValue, setSettingValue] = useSetting<string | number | undefined>(setting.storageGroup, setting.key, setting.defaultValue);
    const [value, setValue] = React.useState<string | number | undefined>(settingValue);
    const [open, setOpen] = React.useState(false);
    const [optionDescription, setOptionDescription] = React.useState<FormattedContent>(setting.options.find(option => option.value === value)?.description || null);
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const [popperBelow, setPopperBelow] = React.useState(false);

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

    const isPopperBelow = () => {
        if (!anchorRef.current) return false;

        const anchorRect = anchorRef.current.getBoundingClientRect();
        const popperRect = document.querySelector('.MuiPaper-root')?.getBoundingClientRect();

        if (!popperRect) return false;

        // Sprawdź, czy górna krawędź Popper jest poniżej dolnej krawędzi Select
        return popperRect.top >= anchorRect.bottom;
    };

    React.useEffect(() => {
        if (open) {
            setPopperBelow(isPopperBelow());
        }
    }, [open]);

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
                    renderValue={(selected) => (selected ? <FormattedText text={setting.options.find(option => option.value === selected)?.label} /> : "Select an option")}
                >
                    {setting.options.map((option) => (
                        <option value={option.value} key={option.value} />
                    ))}
                </Select>
                <Popper
                    open={open}
                    anchorEl={anchorRef.current}
                    placement="bottom-start"
                    style={{
                        zIndex: 1300,
                        width: anchorRef.current ? `${anchorRef.current.offsetWidth}px` : "auto",
                    }}
                >
                    <Paper elevation={3} sx={{ margin: 1 }}>
                        <ClickAwayListener onClickAway={handleClose}>
                            <Box display={"flex"} flexDirection={"column"}>
                                <MenuList
                                    sx={{
                                        maxHeight: 200,
                                        overflow: "auto",
                                    }}
                                >
                                    {setting.options.map((option) => (
                                        <MenuItem
                                            key={option.value}
                                            value={option.value}
                                            onClick={() => setValue(option.value)}
                                            selected={value === option.value}
                                            onMouseEnter={() => {
                                                setOptionDescription(option.description || null)
                                            }}
                                            onMouseLeave={() => {
                                                setOptionDescription(setting.options.find(opt => opt.value === value)?.description || null)
                                            }}
                                        >
                                            <FormattedText text={option.label} />
                                        </MenuItem>
                                    ))}
                                </MenuList>
                                {optionDescription && (<>
                                    <Divider sx={{ order: popperBelow ? 1 : -1 }} />
                                    <Box
                                        sx={{
                                            padding: 4,
                                            display: 'flex',
                                            width: '100%',
                                            order: popperBelow ? 2 : -2,
                                        }}
                                    >
                                        <FormattedText text={optionDescription} />
                                    </Box>
                                </>)}
                            </Box>
                        </ClickAwayListener>
                    </Paper>
                </Popper>
            </Box>
        </SettingInputControl>
    );
};