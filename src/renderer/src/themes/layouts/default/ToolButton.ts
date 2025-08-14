import { alpha, Palette, ThemeOptions } from "@mui/material";
import { borderRadius, rootSizeProperties } from "./consts";
import { themeColors } from "@renderer/types/colors";
import { ButtonComponent } from "@renderer/themes/theme.d/Button";
import { ButtonLayout } from "./Button";


export const ToolButtonLayout = (palette: Palette, _root: ThemeOptions): ButtonComponent => {
    const button = ButtonLayout(palette, _root);

    return {
        ...button,
        styleOverrides: {
            ...button.styleOverrides,
            root: {
                ...(button.styleOverrides?.root as any),
                borderColor: 'transparent',
                borderWidth: 0,
                "&.focused": {
                    outline: "none",
                    '&.focused-keyboard': {
                        ...(button.styleOverrides?.root as any)["&.focused"],
                    }
                },
                "&.size-small": {
                    ...(button.styleOverrides?.root as any)["&.size-small"],
                    minWidth: (button.styleOverrides?.root as any)["&.size-small"].height
                },
                "&.size-medium": {
                    ...(button.styleOverrides?.root as any)["&.size-medium"],
                    minWidth: (button.styleOverrides?.root as any)["&.size-medium"].height
                },
                "&.size-large": {
                    ...(button.styleOverrides?.root as any)["&.size-large"],
                    minWidth: (button.styleOverrides?.root as any)["&.size-large"].height
                },
            },
            content: {
                ...(button.styleOverrides?.content as any),
                padding: "0",
            },
        },
    };
};
