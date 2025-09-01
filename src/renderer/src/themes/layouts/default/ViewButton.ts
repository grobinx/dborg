import { alpha, darken, lighten, Palette, ThemeOptions } from "@mui/material";
import { borderRadius } from "./consts";
import { themeColors } from "@renderer/types/colors";
import { ViewButtonComponent } from "@renderer/themes/theme.d/ViewButton";

export const ViewButtonLayout = (palette: Palette, _root: ThemeOptions): ViewButtonComponent => {
    return {
        styleOverrides: {
            root: {
                outline: "none",
                transition: "all 0.2s ease-in-out",
                cursor: "pointer",
                display: "flex",
                color: palette.mode === "dark" ? darken(palette.sideBar.contrastText, 0.2) : lighten(palette.sideBar.contrastText, 0.2),
                minWidth: 0,
                lineHeight: 0,
                fontSize: "inherit",
                border: 'none',
                borderRadius: borderRadius,
                padding: 4,
                backgroundColor: palette.background.sideBar,
                '& .IconWrapper-root': {
                    fontSize: "1.8em",
                },
                '&.placement-right': {
                    justifyContent: "flex-end",
                },
                ...themeColors.reduce((acc, color) => {
                    acc[`&.color-${color}`] = {
                        color: palette.mode === "light" ? darken(palette[color].main, 0.2) : lighten(palette[color].main, 0.2),

                        "&.hover:not(.disabled):not(.loading), &.focused-keyboard": {
                            color: palette.mode === "light" ? darken(palette[color].main, 0.6) : lighten(palette[color].main, 0.6),
                            backgroundColor: alpha(palette[color].main, 0.3),
                            '&.selected': {
                                backgroundColor: alpha(palette[color].main, 0.4),
                            },
                        },

                        '&.selected': {
                            color: palette.mode === "light" ? darken(palette[color].main, 0.6) : lighten(palette[color].main, 0.6),
                            backgroundColor: alpha(palette[color].main, 0.5),
                        },
                    };
                    return acc;
                }, {}),
                '& .MuiTypography-root': {
                    padding: "2px 6px",
                }
            },
            content: {
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                '&.placement-left': {
                    flexDirection: "row",
                },
                '&.placement-right': {
                    flexDirection: "row-reverse",
                },
                '&.placement-top, &.placement-bottom': {
                    flexDirection: "column",
                }
            }
        }
    }
};
