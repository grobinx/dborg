import { alpha, darken, lighten, Palette, ThemeOptions } from "@mui/material";
import { ContainerButtonComponent } from "@renderer/themes/theme.d/ContainerButton";
import { borderRadius } from "./consts";
import { themeColors } from "@renderer/types/colors";

export const ContainerButtonLayout = (palette: Palette, _root: ThemeOptions): ContainerButtonComponent => {
    return {
        styleOverrides: {
            root: {
                transition: "all 0.2s ease-in-out",
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

                        "&.hover:not(.disabled):not(.loading)": {
                            color: palette.mode === "light" ? darken(palette[color].main, 0.6) : lighten(palette[color].main, 0.6),
                            backgroundColor: alpha(palette[color].main, 0.3),
                            '&.selected': {
                                backgroundColor: alpha(palette[color].main, 0.4),
                            },
                        },

                        '&.selected': {
                            color: palette.mode === "light" ? darken(palette[color].main, 0.6) : lighten(palette[color].main, 0.6),
                            backgroundColor: alpha(palette[color].main, 0.5),
                            outline: '1px solid ' + (palette.mode === "light" ? darken(palette[color].main, 0.6) : lighten(palette[color].main, 0.6))
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
