import { Theme } from "@mui/material";

export const resolveColor = (colorName: string, theme: Theme) => {
    // Obsługa dynamicznych kolorów
    const colorParts = colorName.split(".");
    let color = theme.palette;

    for (const part of colorParts) {
        if (color[part]) {
            color = color[part];
        }
    }

    return color;
};
