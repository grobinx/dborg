import { alpha, Palette, ThemeOptions } from "@mui/material";
import { borderRadius, buttonSizeProperties } from "./consts";
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
            },
            content: {
                ...(button.styleOverrides?.content as any),
                padding: "0",
            },
        },
    };
};
