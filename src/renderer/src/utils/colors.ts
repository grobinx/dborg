import { darken, lighten, PaletteColor, Theme } from "@mui/material";

export const resolveColor = (colorName: string, theme: Theme) => {
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
