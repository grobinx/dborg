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
            content: {
                ...(button.styleOverrides?.content as any),
                padding: "0",
            },
        },
    };
};
