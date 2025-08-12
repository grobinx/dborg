import { Size } from "@renderer/types/sizes";
import { CSSProperties } from "react";

export const borderRadius = 2;
export const paddingSmall = 2;
export const paddingMedium = 4;
export const paddingLarge = 8;

export const rootSizeProperties: Record<Size, CSSProperties> = {
    small: {
        padding: paddingSmall,
        fontSize: "0.9em",
        height: "1.8em",
        gap: paddingSmall,
    },
    medium: {
        padding: paddingMedium,
        fontSize: "1em",
        height: "2em",
        gap: paddingMedium,
    },
    large: {
        padding: paddingLarge,
        fontSize: "1.2em",
        height: "2.4em",
        gap: paddingLarge,
    },
};
