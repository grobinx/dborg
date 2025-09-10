import { Palette } from "@mui/material";
import { Size } from "@renderer/types/sizes";
import { CSSProperties } from "react";

export const borderRadius = 3;
export const paddingSmall = 2;
export const paddingMedium = 4;
export const paddingLarge = 8;

export const rootSizeProperties: Record<Size, any> = {
    small: {
        padding: paddingSmall,
        fontSize: "0.9rem",
        height: "1.7rem",
        minWidth: "1.7rem",
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
        height: "2.4rem",
        minWidth: "2.4rem",
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
        height: "3rem",
        minWidth: "3rem",
        gap: paddingLarge,
        '&.dense': {
            padding: paddingLarge / 2,
            height: "2.2rem",
            minWidth: "2.2rem",
        }
    },
};
