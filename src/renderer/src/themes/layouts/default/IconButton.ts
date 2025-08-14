import { alpha, Palette, ThemeOptions } from "@mui/material";
import { borderRadius, rootSizeProperties } from "./consts";
import { themeColors } from "@renderer/types/colors";
import { ButtonComponent } from "@renderer/themes/theme.d/Button";
import { ButtonLayout } from "./Button";


export const IconButtonLayout = (palette: Palette, _root: ThemeOptions): ButtonComponent => {
    const button = ButtonLayout(palette, _root);

    return {
        ...button,
        styleOverrides: {
            ...button.styleOverrides,
            root: {
                ...(button.styleOverrides?.root as any),
                "&.size-small": {
                    ...(button.styleOverrides?.root as any)["&.size-small"],
                    width: (button.styleOverrides?.root as any)["&.size-small"].height
                },
                "&.size-medium": {
                    ...(button.styleOverrides?.root as any)["&.size-medium"],
                    width: (button.styleOverrides?.root as any)["&.size-medium"].height
                },
                "&.size-large": {
                    ...(button.styleOverrides?.root as any)["&.size-large"],
                    width: (button.styleOverrides?.root as any)["&.size-large"].height
                },
            },
            content: {
                ...(button.styleOverrides?.content as any),
                padding: "0",
            },
        },
    };
};
