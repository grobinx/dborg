import { Palette } from "@mui/material";
import { Size } from "@renderer/types/sizes";
import { CSSProperties } from "react";

export const borderRadius = 3;
export const paddingSmall = 2;
export const paddingMedium = 4;
export const paddingLarge = 6;

export const fontSizeProperties: Record<Size, CSSProperties> = {
    small: {
        fontSize: "0.8rem",
    },
    medium: {
        fontSize: "1rem",
    },
    large: {
        fontSize: "1.2rem",
    },
};

export const buttonSizeProperties: Record<Size, any> = {
    small: {
        padding: `${paddingSmall}px ${paddingSmall * 1.5}px`,
        fontSize: fontSizeProperties.small.fontSize,
        height: "1.7rem",
        minHeight: "1.7rem",
        minWidth: "1.7rem",
        gap: paddingSmall,
        '&.dense': {
            padding: paddingSmall / 2,
            height: "1.2rem",
            minHeight: "1.2rem",
            minWidth: "1.2rem",
        }
    },
    medium: {
        padding: `${paddingMedium}px ${paddingMedium * 1.5}px`,
        fontSize: fontSizeProperties.medium.fontSize,
        height: "2.2rem",
        minHeight: "2.2rem",
        minWidth: "2.2rem",
        gap: paddingMedium,
        '&.dense': {
            padding: paddingMedium / 2,
            height: "1.6rem",
            minHeight: "1.6rem",
            minWidth: "1.6rem",
        }
    },
    large: {
        padding: `${paddingLarge}px ${paddingLarge * 1.5}px`,
        fontSize: fontSizeProperties.large.fontSize,
        height: "2.8rem",
        minHeight: "2.8rem",
        minWidth: "2.8rem",
        gap: paddingLarge,
        '&.dense': {
            padding: paddingLarge / 2,
            height: "2rem",
            minHeight: "2rem",
            minWidth: "2rem",
        }
    },
};

export const inputSizeProperties: Record<Size, any> = buttonSizeProperties;

export const listItemSizeProperties: Record<Size, any> = buttonSizeProperties;
