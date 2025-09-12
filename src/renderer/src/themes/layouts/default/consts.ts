import { Palette } from "@mui/material";
import { Size } from "@renderer/types/sizes";
import { CSSProperties } from "react";

export const borderRadius = 3;
export const paddingSmall = 2;
export const paddingMedium = 4;
export const paddingLarge = 6;

export const rootSizeProperties: Record<Size, any> = {
    small: {
        padding: paddingSmall,
        fontSize: "0.9rem",
        height: "1.8rem",
        minWidth: "1.8rem",
        gap: paddingSmall,
        '&.dense': {
            padding: paddingSmall / 2,
            height: "1.2rem",
            minWidth: "1.2rem",
        }
    },
    medium: {
        padding: paddingMedium,
        fontSize: "1rem",
        height: "2.3rem",
        minWidth: "2.3rem",
        gap: paddingMedium,
        '&.dense': {
            padding: paddingMedium / 2,
            height: "1.6rem",
            minWidth: "1.6rem",
        }
    },
    large: {
        padding: paddingLarge,
        fontSize: "1.2rem",
        height: "2.8rem",
        minWidth: "2.8rem",
        gap: paddingLarge,
        '&.dense': {
            padding: paddingLarge / 2,
            height: "2rem",
            minWidth: "2rem",
        }
    },
};
