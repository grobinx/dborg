import { alpha, Palette, ThemeOptions } from "@mui/material";
import { DriverSelectComponent } from "@renderer/themes/theme.d/DriverSelect";
import { StatusBarButtonComponent } from "@renderer/themes/theme.d/StatusBarButton";
import { themeColors } from "@renderer/types/colors";

export const StatusBarButtonLayout = (palette: Palette, _root: ThemeOptions): StatusBarButtonComponent => {
    return {
        styleOverrides: {
            root: {
                color: palette.statusBar.contrastText,
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
                fontSize: "inherit",
                fontWeight: 400,
                lineHeight: 1,
                transition: "all 0.2s ease-in-out",
                borderRadius: 0,
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
                        color: palette[color].contrastText,

                        "&.hover:not(.disabled):not(.loading)": {
                            backgroundColor: alpha(palette[color].main, 0.2),
                        },

                        "&.focused-keyboard": {
                            transition: "outline-color 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
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
                transition: "opacity 0.2s ease-in-out",
                padding: "0",
                gap: 4,
                '&.loading': {
                    opacity: 0,
                }
            },
        }
    }
};
