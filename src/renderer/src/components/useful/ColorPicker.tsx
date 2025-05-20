import React, { useRef } from "react";
import { BlockPicker, SwatchesPicker } from "react-color";
import { Popover } from "@mui/material";

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    anchorEl: HTMLElement | null;
    onClose: () => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, anchorEl, onClose }) => {
    const open = Boolean(anchorEl);

    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{
                vertical: "bottom",
                horizontal: "left",
            }}
            transformOrigin={{
                vertical: "top",
                horizontal: "left",
            }}
            slotProps={{
                paper: {
                    sx: {
                        overflow: "hidden",
                    },
                },
            }}
        >
            <SwatchesPicker
                color={value}
                onChangeComplete={(color) => onChange(color.hex)}
            />
        </Popover>
    );
};

export default ColorPicker;