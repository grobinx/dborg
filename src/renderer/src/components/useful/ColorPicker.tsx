import React, { useRef } from "react";
import { BlockPicker, ChromePicker, CompactPicker, GithubPicker, MaterialPicker, PhotoshopPicker, SketchPicker, SwatchesPicker, TwitterPicker } from "react-color";
import { Popover } from "@mui/material";

export type ColorPickerType = "block" | "swatches" | "compact" | "material" | "sketch" | "twitter" | "gitchub" | "chrome" | "photoshop";

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    anchorEl: HTMLElement | null;
    onClose: () => void;
    picker?: ColorPickerType;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ 
    value, 
    onChange, 
    anchorEl, 
    onClose,
    picker = "swatches"
}) => {
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
            {picker === "block" && (
                <BlockPicker
                    color={value}
                    onChangeComplete={(color) => onChange(color.hex)}
                />
            )}
            {picker === "swatches" && (
                <SwatchesPicker
                    color={value}
                    onChangeComplete={(color) => onChange(color.hex)}
                />
            )}
            {picker === "compact" && (
                <CompactPicker
                    color={value}
                    onChangeComplete={(color) => onChange(color.hex)}
                />
            )}
            {picker === "material" && (
                <MaterialPicker
                    color={value}
                    onChangeComplete={(color) => onChange(color.hex)}
                />
            )}
            {picker === "sketch" && (
                <SketchPicker
                    color={value}
                    onChangeComplete={(color) => onChange(color.hex)}
                />
            )}
            {picker === "twitter" && (
                <TwitterPicker
                    color={value}
                    onChangeComplete={(color) => onChange(color.hex)}
                />
            )}
            {picker === "gitchub" && (
                <GithubPicker
                    color={value}
                    onChangeComplete={(color) => onChange(color.hex)}
                />
            )}
            {picker === "chrome" && (
                <ChromePicker
                    color={value}
                    onChangeComplete={(color) => onChange(color.hex)}
                />
            )}
            {picker === "photoshop" && (
                <PhotoshopPicker
                    color={value}
                    onChangeComplete={(color) => onChange(color.hex)}
                />
            )}
        </Popover>
    );
};

export default ColorPicker;