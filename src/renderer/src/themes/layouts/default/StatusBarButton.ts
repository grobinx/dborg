import { alpha, darken, lighten, Palette, ThemeOptions } from "@mui/material";
import { StatusBarButtonComponent } from "@renderer/themes/theme.d/StatusBarButton";
import { themeColors } from "@renderer/types/colors";

export const StatusBarButtonLayout = (palette: Palette, _root: ThemeOptions): StatusBarButtonComponent => {
    return {
        styleOverrides: {
            root: {
                //color: palette.statusBar.contrastText,
                height: "100%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                border: "none",
                cursor: "pointer",
                userSelect: "none",
                textDecoration: "none",
                fontFamily: "inherit",
                fontSize: '0.875em',
                fontWeight: 600,
                lineHeight: 1,
                backgroundColor: "transparent",
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
                whiteSpace: "nowrap",
                padding: "4px 6px",
                '&.focused-keyboard': {
                    borderColor: 'transparent',
                    outlineWidth: 2,
                    outlineStyle: 'solid',
                    outlineOffset: -2,
                },
                ...themeColors.reduce((acc, color) => {
                    acc[`&.color-${color}`] = {
                        color: palette.mode === "light" ? darken(palette[color].main, 0.6) : lighten(palette[color].main, 0.6),

                        "&.hover:not(.disabled):not(.loading)": {
                            backgroundColor: alpha(palette[color].main, 0.2),
                        },

                        "&.focused-keyboard": {
                            outlineColor: palette[color].main,
                        },

                    };
                    return acc;
                }, {}),
            },
            content: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0",
                gap: 4,
                '&.loading': {
                    opacity: 0,
                }
            },
        }
    }
};
