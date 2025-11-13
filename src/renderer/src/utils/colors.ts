import { darken, lighten, PaletteColor, Theme } from "@mui/material";

export const resolveColor = (colorName: string | undefined, theme: Theme) => {
    if (!colorName) return undefined;
    // Obsługa dynamicznych kolorów
    const colorParts = colorName.split(".");
    let color: any = theme.palette;

    for (const part of colorParts) {
        if (color[part]) {
            color = color[part];
        }
    }

    return color;
};

export function createPaletteColor(mainColor: string, contrastText: string): PaletteColor {
    return {
        light: lighten(mainColor, 0.2),
        main: mainColor,
        dark: darken(mainColor, 0.2),
        contrastText: contrastText,
    };
}

export interface Rgba {
    r: number;
    g: number;
    b: number;
    a: number;
}

export function colorToRgba(color: string, alpha?: number): Rgba | null {
    if (!color) return null;

    // rgb/rgba
    const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;
    const rgbaRegex = /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d*\.?\d+)\s*\)$/i;

    let match = color.match(rgbaRegex);
    if (match) {
        return {
            r: parseInt(match[1], 10),
            g: parseInt(match[2], 10),
            b: parseInt(match[3], 10),
            a: parseFloat(match[4]),
        };
    }
    match = color.match(rgbRegex);
    if (match) {
        return {
            r: parseInt(match[1], 10),
            g: parseInt(match[2], 10),
            b: parseInt(match[3], 10),
            a: alpha ?? 1,
        };
    }

    // hex
    let hex = color.replace(/^#/, "");
    let bigint: number;
    if (hex.length === 3) {
        hex = hex.split("").map(c => c + c).join("");
    }
    if (hex.length === 6) {
        bigint = parseInt(hex, 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255,
            a: alpha ?? 1,
        };
    }
    if (hex.length === 8) {
        bigint = parseInt(hex, 16);
        return {
            r: (bigint >> 24) & 255,
            g: (bigint >> 16) & 255,
            b: (bigint >> 8) & 255,
            a: ((bigint & 255) / 255),
        };
    }

    return null;
}

export function blendColors(color1: string, color2: string, ratio: number = 0.5, alpha?: number): string {
    if (!color1 || !color2) return "";

    const rgb1 = colorToRgba(color1, alpha)!;
    const rgb2 = colorToRgba(color2, alpha)!;

    const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
    const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
    const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);

    // Jeśli alpha nie podano, wylicz średnią ważoną z obu kolorów (domyślnie 1 jeśli brak a)
    let a: number;
    if (alpha !== undefined) {
        a = alpha;
    } else {
        const a1 = rgb1.a !== undefined ? rgb1.a : 1;
        const a2 = rgb2.a !== undefined ? rgb2.a : 1;
        a = a1 * (1 - ratio) + a2 * ratio;
    }

    return `rgba(${r},${g},${b},${a})`;
}
