import { Size } from "@renderer/types/sizes";
import { CSSProperties } from "react";

export const borderRadius = 3;
export const paddingSmall = 2;
export const paddingMedium = 4;
export const paddingLarge = 8;

export const rootSizeProperties: Record<Size, CSSProperties> = {
    small: {
        padding: paddingSmall,
        fontSize: "0.9rem",
        height: "1.6rem",
        gap: paddingSmall,
    },
    medium: {
        padding: paddingMedium,
        fontSize: "1rem",
        height: "2rem",
        gap: paddingMedium,
    },
    large: {
        padding: paddingLarge,
        fontSize: "1.2rem",
        height: "2.6rem",
        gap: paddingLarge,
    },
};
